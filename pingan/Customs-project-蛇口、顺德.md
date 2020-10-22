# Customs-project：

## 需求1：深圳海关

去深圳海关现场支持工作，把海关网页上的“导出”按钮给禁用掉。

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





## 需求2：亿康

需求：完成邮件发送接口开发，集成在港口模块中！

### Interface层:

邮件开发在浏览器书签有，发送多个收件人也在书签有。

```java
/**
  * ...... //1、写好注释。
  */
@RequestMapping(value = "sendMail/api/V1") 
public interface IMailService { //2、创建一个新接口文件，加上路径注解。
    
    /**
      * 发送文本邮件
      * @param to 收件人
      * @param subject 主题
      * @param content 内容 //3、写好注释。
      */
    @RequestMapping(value = "/simpleMail", method = RequestMethod.POST) 
    @ApiOperation(value = "发送普通邮件")
    void sendSimpleMail(String to, String subject, String content); //4、写好方法名，参数列表，加上路径注解。
    
    /**
      * 发送带附件的邮件
      * @param to 收件人
      * @param subject 主题
      * @param content 内容
      * @param filePath 附件
      */
    @PostMapping(value = "attachmentsMail")
    @ApiOperation(value = "发送带附件邮件")
    void sendSimpleMail(String to, String subject, String content, String filePath); //5、写好方法名，参数列表，加上路径注解。
}
```

#### Tips：

> 1、如上，直接在接口上添加匹配路径注解，然后在下面Controller层中实现接口并实现接口的方法，测试发现@Requestmapping注解一样可以发挥作用，这就是springboot的神奇之处。
>
> 2、就可以不用写实现类，不用写实体类。直接就这两个文件写代码。。方便、简洁不少！
>
> 3、浏览器书签一直说要加一个 "-starter-mail" 依赖 jar包，但是加了怎么怎么不对。。其实可以不用加，因为springbootframework里内置了这个jar包。或者不知道是不是我的仓库地址不对，导致下载不了这个jar包。



### Controller层：

```java
/**
  * ......  //1、写好注解。
  */
@Slf4j
@Api(tags = "发送邮件")
@RestController
public class IMailController implements IMailService { //2、新建一个Controller文件，实现接口，加上注册注解、日志注解，swagger注解。
    
    /**
      * Spring boot 提供了一个发送邮件的简单抽象，直接注入接口使用。
      */ 
    @Autowired
    private JavaMailSender mailSender;
    
   /**
     * 配置文件中我的邮箱地址
     */
    @Value("${spring.mail.from}")
    private String from; //3、配置文件代码在浏览器书签有。
    
    @Override
    public void sendSimpleMail(String to, String subject, String content) { //4、实现方法，代码在浏览器书签有。
        log.info("----Send SimpleMail is starting!----");
        //创建SimpleMailMessage对象
        SimpleMailMessage message = new SimpleMailMessage();
        //邮件发送人
        message.setFrom(from);
        //邮件接收人
        message.setTo(to);
        //邮件主题
        message.setSubject(subject);
        //邮件内容
        message.setText(content);
        //发送邮件
        message.send(message);
    }
    
    @Override
    public void sendAttachmentMail(String to, String subject, String content) { //5、实现方法，代码在浏览器书签有。
        log.info("----Send AttachmentMail is starting!----");
        MimeMessage message = mailSender.createMimeMessage(); //6.这里要导入一个jar包，一开始以为是starter-mail，原来是 javax.mail，mail，1.4.7 这个jar包。
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            
            FileSystemResource file = new FileSystemResource(new File(filePath));
            String fileName = filePath.substring(filePath.lastIndexOf(File.separator));
            helper.addAttachment(fileName, file);
            mailSender.send(message);
            //日志信息
            log.info("邮件已经发送。");
        } catch (MessagingException e) {
            log.error("发送有件事发生异常"， e); //7、代码书签里有，测试一下，完成邮件发送开发！
        }
    }
}
```



## 需求三：暂时手动导入顺德出口数据，为上链做准备。

> 需求：出口货物用驳船运往蛇口，装上大船，再出口到顺德（大船才能出口运输）。。蛇口出口数据可以自动同步数据，我们不用管，但是顺德的出口数据没有做程序处理，所以暂时手动输入数据。因为领导可能在等我们输入的数据，所以以后顺德数据也是会做程序化处理的。导入完毕，会自动上链。
>
> 

##### 1、业务会发一个如下图的数据表。

![1603334027114](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603334027114.png)

图序1：表名。

图序2：要插入数据的五张表名。第六张表不管，里面没写数据。

图序3：根据表中给的箱号、订舱单号、提运单号 一一对应填入数据库表中。

图序4：containerid 用浏览器的时间戳在线转换工具填入。

图序5：有些中文值是使用"转化后的值"。但是有时候"转化后的值"会超出数据库表中字段约束的大小范围，跟顺德业务沟通，看他们跟蛇口怎么做转换。

图序6：船名要注意，要保留空格。

图序7：只有一个值的，说明插入数据时都是用一样的值。



##### 2、插入数据。

如下图，可以先把表结构导出为Excel表，再下载到本地，方便操作数据。

![1603335987614](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603335987614.png)

1、导出的Excel表。

2、sycn_data_id用时间戳的值。会发现顺德业务表的字段都是到 lastupdatetime 就没了。但我们数据库表的后面还有字段，因为 lastupdatetime 后面的字段是代码程序处理的时候赋值进去了。

3、process_status : '处理状态：0-初始化，1-待上链，2-已上链，3-上链失败'

4和5、都是用时间戳的值。

6、上链机构一定不能填错，顺德暂时用江门 (JM)。

> Tips：
>
> 1、问：数据对碰的时候船名是不会自动处理空格的，所以会导致空格少了的问题。这样我们可能就要再操作一次导入数据，再重新上链，就会很麻烦。
>
> 解：所以我们一般不重新操作导入。比如哪条数据船名错了，我们改正确之后。把那条数据的 sync_version 版本号改高一点，然后把 process_status 改为1 即可！



##### 3、从Excel表导入数据库。

如下图，注意Excel中每个字段都要选中。Ctrl+c复制。

![1603338177795](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603338177795.png)

如下图：图序1、打开对应表格。2、点击新建按钮。3、如下下图显示为蓝色框框。4、Ctrl+v粘贴，即可把Excel表数据导入数据库表中。

![1603338182537](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603338182537.png)

下下图：

![1603338456250](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603338497290.png)



##### 4、把出口数据导入招商云数据库。

1、从非标机浏览器上登录招商云网页，

链接： https://cloud.cmft.com

登录账号是手机号码: 18588455213

密码是 Cmhk@1872

![1603338865957](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603338865957.png)

2、点击 控制台 -> 生产是14.24的堡垒机，用admin03登录，密码为Cmhk@1872。

3、把本地数据库里的数据导出为insert 的SQL语句，保存在记事本上 （insert.sql） 。然后在招商云网页上按下Ctrl+Alt+Shift，即可调出一个面板，点击 一个 uploadfile 上传按钮。选择我们 insert.sql文件，就可以从本地上传到招商云环境上。

​      同理，点击招商云环境里的 我的电脑，有个名字类似磁盘的点击打开，里面有个Download 下载文件夹。把标结构Excel表格放进去，即可用浏览器的下载功能下载到非标机本地中！



































