# Customs-project：

需求：去深圳海关现场支持工作，把海关网页上的“导出”按钮给禁用掉。

### Entity层：

新建HaiGuan实体类：

```java
/**
  * ......
  */
@Setter
@Getter
@Component //1、把普通pojo实例化到spring容器中，当实现类依赖注入的时候就可以找得到这个实体类。
@ConfigurationProperties(prefix = "haiguan") //2、添加此注解，可以批量注入配置文件的值。支持松散绑定，只需要指定一个前缀，就能绑定有这个前缀的所有属性值。 填写前缀。。
public class HaiGuan { 
    
    private Boolean download; //3、创建属性值,布尔类型。
}
```

### Config层：

application-dev.properties:

```java
......
haiguan.download=true //1、在配置文件中填写属性值。
    ......
```

### Controller层：

拿集装箱综合信息的查询接口来试试这个注解是否成功。

```java
private HaiGuan gaiGuan; //1、注入实体类。

public ResultBase<PageResp<ContInfoQueryResp>> page(
    @RequestBody @Validated PageReq<ContInfoQueryReq> pageReq) {
    if(haiGuan.getdownload()) { //2、取出实体类的属性布尔值，在配置文件里已经设置好值。再用if判断。
        log.info(......)
        ........
    }
    Optional.ofNullable(null).orElseThrow(() -> ServiceException.of(ExceptionEnum.EXCEPTION_UNKNOW)); //3、当布尔值为false，弹出未知异常信息。
    return ResultUtil.of(null); //4、返回空数据。
}
```

测试： 用前端页面测试一下，点击综合信息的“查询”接口，看到列表为空，说明逻辑没错！

拓展：给每个“导出”接口的代码添加这个判断，如果以后又想把“导出”功能改回来，直接修改配置文件中的属性值即可！

#### Tips：

> 1、当用F12的Network查看接口路径模糊不清的时候，可以用Elements窗口再点击左上角的鼠标指针定位某一行的前端代码。即可查看接口路径。

















































































