var fs = require("fs-plus"),
	path = require("path");

var _MAX_COUNT = 600;
var _MAX_ITER = 4000;
var isWin = process.platform == 'win32',

onmessage = function(e) {
	var command = e.data[0],
		args = e.data.slice(1);

	api[command].apply(null, args);
}

var workspace_;
var fsWatcher;

var watchFolder = function(folder){
	if(fsWatcher){
		fsWatcher.close();
	}
	if(!folder) return;

	function addFileOrFolder(filepath, attr){
		if(!attr || attr.shouldIgnore) return;

		if(attr.isFile){
			postMessage({
				"type": "addInitFiles",
				"detail": [[filepath], [path.basename(filepath)], [attr.mtime]]
			});
		}

		if(attr.isDir){
			var pathArray = [], fileArray = [], modifiedDateArray = [];
			
			walk(filepath, function(filepath, filename, attr){
				pathArray.push(filepath);
				fileArray.push(filename);
				modifiedDateArray.push(attr.mtime);
			}).then(function(){
				postMessage({
					"type": "addInitFiles",
					"detail": [pathArray, fileArray, modifiedDateArray]
				})
			});
		}
	}

	/*if(false){
		var options = {};
		options.CHANGE_FILE_SIZE = false;
		options.CHANGE_LAST_WRITE = false;
		options.CHANGE_LAST_ACCESS = false;
		options.CHANGE_ATTRIBUTES = false;
		options.CHANGE_SECUTITY = false;
		options.WATCH_SUB_DIRECTORIES = true;
		options.CHANGE_CREATION = true;

		fsWatcher = require("fswin-aio").dirWatcher(folder, function(eventType, message){

			if(_suppressOnChange) return;

			console.debug("Detect change event " + eventType + " " + (message && message.OLD_NAME || message));

			if(eventType == "ERROR"){
				console.error(eventType + " " + message);
				return;
			} else if(eventType == "STARTED"){
				return;
			} else if(eventType == "MOVED") {
				return;
			}

			var fileName = typeof message === 'string' ? message : message.OLD_NAME,
				filepath = path.join(folder, fileName);

			if(eventType == "ADDED"){
				statWrapper(filepath, function (attr) {
					addFileOrFolder(filepath, attr);
				});
			}

			if(eventType == "REMOVED"){
				postMessage({
					"type": "removeInitFiles",
					"detail": [filepath]
				});
			}

			if(eventType == "RENAMED"){
				postMessage({
					"type": "removeInitFiles",
					"detail": [filepath]
				});

				filepath = path.join(folder, message.NEW_NAME);
				statWrapper(filepath, function (attr) {
					addFileOrFolder(filepath, attr);
				});
			}
		}, options);
	} else {*/
		fsWatcher = require("chokidar").watch(folder, {
		  ignored: function(filepath, stats){
		  	var attr = statsToAttr(filepath, stats);
		  	return !attr || attr.shouldIgnore;
		  },
		  ignoreInitial: true
		});
		fsWatcher.on("add", function(filepath, stats){
			var attr = statsToAttr(filepath, stats);
			if(!attr || attr.shouldIgnore || attr.isDir) return;
			addFileOrFolder(filepath, attr);
		}).on("unlink", function(filepath){
			postMessage({
				"type": "removeInitFiles",
				"detail": [filepath]
			});
		}).on("addDir", function(folder, stats){
			var attr = statsToAttr(folder, stats);
			if(!attr || attr.shouldIgnore) return;
			addFileOrFolder(folder, attr);
		}).on("unlinkDir", function(filepath){
			postMessage({
				"type": "removeInitFiles",
				"detail": [filepath]
			});
		});
	/*}*/
}

var statsToAttr = function(filepath, stats){
	if(!stats) return null;

	var attr = {};
	attr.isDir = stats.isDirectory();
    attr.isFile = stats.isFile();
    attr.mtime = stats.mtime;
    attr.size = stats.size/1000;

    var name = path.basename(filepath);

    if(/\.asar[/\\]*$/.exec(name)) {
        attr.isFile = true;
        attr.isDir = false;
        attr.shouldIgnore = true;
    }

    if(attr.isDir){
        attr.shouldIgnore = (name == "node_modules") ;
    } else if(attr.isFile){
        attr.shouldIgnore =  attr.shouldIgnore || !canOpenByTypora(name) || attr.size > 1000;
    }
    return attr;
}

var statWrapper = function(filepath, callback) {
    var attr = {},
        name = path.basename(filepath);

    if(name && name[0] == "."){
        attr.shouldIgnore = true;
        return callback(attr);
    }
    require("fs").stat(filepath, function(error, stats){
        if(error || !stats){
            return callback(null);
        }

        attr = statsToAttr(filepath, stats);
        callback(attr);
    });
};

var canOpenByTypora = function (filename) {
	if(filename[0] == ".") return false;
	var ext = path.extname(filename).replace(/^\./, '');
	if(~["", "md", "markdown", "mdown", "mmd", "text", "txt", "rmarkdown", "mkd", "mdwn", "mdtxt", "rmd", "mdtext"].indexOf(ext.toLowerCase())){
		return true;
	}
}

var walk = function(rootPath, onFile, onDir){
	var shouldBreak;

	function walkNode(filename, parent){
		return new Promise(function(resolve, reject){
			if(filename[0] == "." || filename == "node_modules" || shouldBreak){
				return resolve();
			}

			var childPath = path.join(parent, filename);

			statWrapper(childPath, function(attr){
				if(!attr || attr.shouldIgnore) return resolve();

				if(attr.isDir){
					if(onDir && onDir(childPath, filename, attr) === false) {
						shouldBreak = true;
						return resolve();
					}

					walkFolder(childPath).then(resolve);
					return;
				}

				if(attr.isFile){
					if(onFile && onFile(childPath, filename, attr) === false){
						shouldBreak = true;
					}
				}

				return resolve();
			});
		});
	}

	function walkFolder(folder){
		return new Promise(function(resolve, reject){
			fs.readdir(folder, function(err, files){
				if(err) return resolve();

				Promise.all(files.map(function(filename){
					return walkNode(filename, folder);
				})).then(resolve);
			});
		});
	}

	return new Promise(function(resolve, reject){
		if(!rootPath) return resolve();

		walkFolder(rootPath).then(resolve);
	});
}

var listAllFiles = function(rootPath){
	workspace_ = rootPath;
	var pathArray = [], fileArray = [], modifiedDateArray = [];
	var fetchedCount = 0, iterCount = 0;
	var needBackEndQuery = false;

	watchFolder(rootPath);
	
	if(!rootPath){
		postMessage({
			"type": "initFileCache",
			"detail": [pathArray, fileArray, modifiedDateArray, needBackEndQuery ? _MAX_COUNT + 2 : fetchedCount]
		});
		return;
	}

	walk(rootPath, function(filepath, filename, attr){
		iterCount++;
		pathArray.push(filepath);
		fileArray.push(filename);
		modifiedDateArray.push(attr.mtime);
		fetchedCount++;
		if(fetchedCount > _MAX_COUNT || iterCount > _MAX_ITER){
                needBackEndQuery = true;
            return false
        }
	}).then(function(){
		postMessage({
			"type": "initFileCache",
			"detail": [pathArray, fileArray, modifiedDateArray, needBackEndQuery ? fetchedCount + 2 : fetchedCount]
		})
	});
}

var curQueryKey_;
var _MAX_QUERY_HIT = 100;

var quickFind = function(rootPath, key){
	if(!rootPath) return;

	curQueryKey_ = key;

	var hitCount = 0;

	var reg = new RegExp(key.replace(/[*]/g, ' ').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").split(/\s+/).join(".*"), "i");

	walk(rootPath, function(filepath, filename, attr){
		if(!curQueryKey_) return false;
		if(curQueryKey_ != key) return false;
		if(canOpenByTypora(filename) && reg.exec(filename)){
			hitCount++;
			if(hitCount > _MAX_QUERY_HIT) return false;
			postMessage({
				"type": "queryMatch",
				"detail": [[filepath]]
			})
		}
	}, function(filepath, filename, attr){
		if(!curQueryKey_) return false;
		if(curQueryKey_ != key) return false;
	}).then(function(){
		if(curQueryKey_ == key){
			postMessage({
				"type": "queryEnd"
			});
		}
	});
}

var stopQuery = function(){
	curQueryKey_ = undefined;
}

var api = {
	listAllFiles: listAllFiles,
	quickFind: quickFind
}
