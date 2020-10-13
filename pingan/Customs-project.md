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













































































