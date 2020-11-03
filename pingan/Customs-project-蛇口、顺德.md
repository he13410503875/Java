# Customs-project：

##  金融壹账通企业金融服务中心跨境贸易智慧监管及物流团队

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





## 需求2：蛇口-亿康

需求：完成邮件发送接口开发，集成在港口模块中！

### Config层：

application.properties

```properties
#E-mail邮箱配置
spring.mail.host=smtp.126.com
spring.mail.protocol=smtps
spring.mail.username=he13410503875@126.com
spring.mail.password=UEFMSVOSPMOTBUPZ
#465是写smtps服务器，25写smtp。
spring.mail.properties.mail.smtp.port=465 
spring.mail.default-encoding=UTF-8
spring.mail.from=he13410503875@126.com
```



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
>
> 4、本地开发的配置文件更改了，如果没通知几个测试环境也改配置文件，则启动服务会报错。（比如：使用注解引入配置文件里的值@Value("${spring.mail.from}")，如果其他测试环境的配置文件里没有值，启动服务就会报错），所以要通知几个测试环境也要修改配置文件然后发版。。



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

##### Tips：

> 1、如何测试：
>
> 解：1）与招商确认的邮箱配置已发公司邮箱，但招商云到邮箱服务器的网络不通，还需要招商金科同事与SCT网络同事对邮件服务器开墙，目前已提交申请。
>
> 2）邮件发送的接口要挪到dataex-server，因为只有这个服务器是与SCT相通，而且数据集成及公共服务都放在这里。
>
> 3）用非标机写好测试类测试邮件发送，却报错用不了，怎么办？我们还可以在启动类里写匹配方法去测试。。犀利！是哪
>
> 2、可以先在非标机上测试一下，自己发给自己邮件，看看能不能发送成功。用126邮箱 有时会报错：Got bad greeting from SMTP host: smtp.126.com, port: 465, response: [EOF]
>
> 解：如下图，要在126邮箱里开启这两个SMTP服务即可解决这报错。最后发邮件成功！
>
> ![1604308621120](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1604308621120.png)
>
> 3、测试发送Html邮件方法时的报错信息： 554 DT:SPM 126 smtp8,NORpCgDn9_cR3p9f3+wvMA--.2778S2 1604312594,please see http://mail.163.com/help/help_spam_16.htm?ip=210.83.240.178&hostid=smtp8&time=1604312594。
>
> 解：一直被126邮箱视为垃圾邮件，所以发送不成功。。在126里设置了白名单还是没用。所以接收人就不写126了，发送给两个QQ邮箱即可！如下图启动类里。
>
> ![1604312738264](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1604312738264.png)



## 需求三：从Excel表手动导入顺德出口数据，为上链做准备。

> 需求：出口货物用驳船运往蛇口，装上大船，再出口到顺德（大船才能出口运输）。。蛇口出口数据可以自动同步数据，我们不用管，但是顺德的出口数据没有做程序处理，所以暂时手动输入数据。因为领导可能在等我们输入的数据，所以以后顺德数据也是会做程序化处理的。导入完毕，会自动上链。



#### 1、把Excel表导入数据库。

业务会发两张Excel表：containers，berthplan。

1) 点击Navicat的“导入向导” --> “*.xls”格式 -->  选择 containers.xls文件 --> 一直点下一步，直到目标表出现，改目标表名字 --> 

出现全部字段类型都是varchar ，长度都是255。如果直接点下一步开始执行，会报错。一整行字段列表的长度超过了最大值。--> 可以修改类型为text，长度全删，为空。-->

再下一步-开始。成功！ 注意：如果表Excel表字段超过180-200个之间，也会创建Excel表失败。。。就像berthplan.xls表格。所以可以把它分成两个Excel表格来导入。



#### 2、根据核心字段对比列表写好这6张表的 insert into 语句。

```sql
--block_track_cont_info：

insert into block_track_cont_info (
containerid,containerno,bl,do,containertype,containersize,containerowner,inaim,inowner,
invesselname,invesselcode,inboundvoy,outboundvoy,pol,tpod,pod,finalport,    isdamage,
emptyfull,grossweight,vermasweight,  isimdg,    vesselcompanysealno,stampno,gradeid,batchno,lastupdatetime, busi_type,process_status,sync_version,creator_org_id)
SELECT 
c.containerid,c.CONTAINERNO,c.bl,c.do,c.containertype,c.CONTAINERSIZE,c.CONTAINEROWNER,c.INAIM,b1.`OWNER`,
b1.EVESSELNAME,'',b1.inboundvoy, b1.outboundvoy,c.pol,c.pol,c.pod,c.FINALPORT,  'N', 
c.EMPTYFULL,c.GROSSWEIGHT,c.GROSSWEIGHT,    'N',c.VESSELCOMPANYSEALNO,'QKL',c.GRADEID,c.BATCHNO,NOW(), 'export','1',c.GROSSWEIGHT,'JM'--1、这里c.vesselcompanysealno对应着 上面的sync_version，因为是个主键，值不能重复。又找不到方法插入不同的值，所以先把有不同值的字段取出，赋值给它。
FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno;

--block_track_cont_optout:

insert into block_track_cont_optout (
containerid,containerno,containerowner,do,bl,terminalcode,opttype,avesselname,boundvoy,
emptyfull,isimdg,dangerlevel,ciqsealno,vesselcompanysealno,grossweight,vermasweight,setuptemp,temptype,
specialstow,overtop,overfront,overbehind,overleft,overright,isdamage,process_status,sync_version,creator_org_id)
SELECT 
c.containerid,c.containerno,b1.owner,c.do,c.bl,c.terminalcode,'装船',b1.cvesselname,b1.outboundvoy,
c.emptyfull,'N',c.dangerlevel,c.ciqsealno,c.vesselcompanysealno,c.grossweight,c.grossweight,c.setuptemp,c.temptype,
c.specialstow,c.overtop,c.overfront,c.overbehind,c.overleft,c.overright, 'N' ,'1',c.VESSELCOMPANYSEALNO,'JM'
FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno;

--block_track_cont_release：

insert into block_track_cont_release (
containerid,containerno,containerowner,do,bl,relstate,lastupdatetime,process_status,sync_version,creator_org_id)
SELECT
c.containerid,c.containerno,b1.owner,c.do,c.bl,'R',now(),'1',c.VESSELCOMPANYSEALNO,'JM'
FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno;

--block_track_barge_shipment：

insert into block_track_barge_shipment (
berthplanno,cvesselname,avesselname,owner,agent,barge_tel,imo,inboundvoy,outboundvoy,invessellinecode,
outvessellinecode,inbusinessvoy,outbusinessvoy,bargestartport,lastport,nextport,bargeendport,
bargeworkseq,memo,eta_time,atb_time,atd_time,bargefeetype,bargerobcount,bargerobweight,isbargefee,isbargeovervolume,isbargeoverweight,
inmemo,outmemo,hotbox,close_time,lastupdatetime,terminalcode,   inaim,businesscode,containerowner,process_status,sync_version,creator_org_id)
SELECT
-- 注意： agent -> inagent或outagent 
b1.berthplanno,b1.cvesselname,b1.avesselname,b1.owner,b1.outagent,b1.barge_tel,b1.imo,b1.inboundvoy,b1.outboundvoy,b1.invessellinecode,
b1.outvessellinecode,b1.inbusinessvoy,b1.outbusinessvoy,b1.bargestartport,b1.lastport,b1.nextport,b1.bargeendport,
b1.bargeworkseq,b1.memo,b1.eta_time,b1.atb_time,b1.atd_time,b1.bargefeetype,b1.bargerobcount,b1.bargerobweight,b1.isbargefee,b1.isbargeovervolume,b1.isbargeoverweight,
b1.inmemo,b1.outmemo,b1.hotbox,b1.close_time,now(),b1.terminalcodes, c.inaim,c.businesscode,c.containerowner,'1',c.vesselcompanysealno,'JM'
FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno;

--block_track_ship_option

insert into block_track_ship_option (
berthplandetailid,berthplanno,vesseltype,avesselname,inboundvoy,outboundvoy,terminalcode,berthno,qcnos,
atb_time,ats_d,atc_d,ats_l,atc_l,atd_time,lastupdatetime,sync_version,process_status,creator_org_id
)
-- 注意：ats_d,atc_d,ats_l,atc_;. 
SELECT 
b1.berthplandetailid,b1.BERTHPLANNO,b1.VESSELTYPE,b1.AVESSELNAME,b1.INBOUNDVOY,b1.OUTBOUNDVOY,b1.TERMINALCODES,b1.BERTHNO,'',
b1.ATB_TIME, now(),now(),now(),now(),b1.ATD_TIME,now(),c.VESSELCOMPANYSEALNO,'1','JM'

FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno;

insert into block_track_barge_cfmeta (
avesselname,inboundvoy,outboundvoy,terminalcode,etaconfirmtime,process_status,sync_version,creator_org_id,data_id
)
-- 注意：ats_d,atc_d,ats_l,atc_;. 
SELECT 
 b1.AVESSELNAME,b1.INBOUNDVOY,b1.OUTBOUNDVOY,b1.TERMINALCODES,now(),'1',c.VESSELCOMPANYSEALNO,'JM',c.VESSELCOMPANYSEALNO
FROM `containers` c , berthplan01 b1 WHERE c.inberthplanno=b1.berthplanno or c.outberthplanno=b1.berthplanno group by b1.AVESSELNAME,b1.INBOUNDVOY,b1.OUTBOUNDVOY,b1.TERMINALCODES;
```





##### 2、插入数据。

如下图，可以先把表结构导出为Excel表，再下载到本地，方便操作数据。

![1603335987614](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603335987614.png)

1、导出的Excel表。

2、sycn_data_id用时间戳的值。会发现顺德业务表的字段都是到 lastupdatetime 就没了。但我们数据库表的后面还有字段，因为 lastupdatetime 后面的字段是代码程序处理的时候赋值进去了。

3、process_status : '处理状态：0-初始化，1-待上链，2-已上链，3-上链失败'

4和5、都是用时间戳的值。

6、上链机构一定不能填错，顺德暂时用沿江 (JM)。

> Tips：
>
> 1、问：数据对碰的时候船名是不会自动处理空格的，所以会导致空格少了的问题。这样我们可能就要再操作一次导入数据，再重新上链，就会很麻烦。
>
> 解：所以我们一般不重新操作导入。比如哪条数据船名错了，我们改正确之后。把那条数据的 sync_version 版本号改高一点，然后把 process_status 改为1 即可！
>
> 2、把字段跟数据都导出到Excel。
>
> 解：1、打开Navicat表格，选择一行数据之后右键，选择"复制为"。
>
> ​        2、点击"制表符分隔值（仅字段名）"，再Ctrl+v到Excel就可以把表格字段全部Copy下来。
>
> ​        3、选择"制表符分隔值（字段名和数据）"，再Ctrl+v就可以把表格字段和数据全Copy下来。
>
> 3、把招商云环境的表字段跟数据都下到本地数据库。
>
> 解：1、在Navicat "对象"界面多个勾选想要复制的表格，右键，选择"转储为SQL文件"。
>
> ​        2、点击 "结构和数据..."，保存xx.sql文件到桌面。打开文件，全选sql语句。
>
> ​        3、之后在本地执行sql语句，即可把表结构和数据复制到本地数据库。



##### 3、从Excel表复制进数据库。

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

4、打开江门数据库，打开对应的track表执行insert语句即可！

![1603696251891](F:\Java-Route\pingan\Customs-project-蛇口、顺德.assets\1603696251891.png)





## 四、部署在服务器上的注意事项：

1、同一个包部署在不同的服务器上时，要注意两个包的配置文件里，数据库地址不要相同，否则会导致数据冲突！





































