# 大船驳船API-Development

页面需求开发：如下图，根据PRD需求文档开发“查询”接口，“详情”,还有 “下拉框” 接口。

![1592191699077](C:\Users\admin\Desktop\pingan\API-Development.assets\1592191699077.png)



## 1、“查询”接口--最快的方法：模仿别人的代码敲！

开发代码之前都要拉取一下最新代码。

#### （1）Controller层：

复制粘贴别人的 .java 文件，修改好知名达意的名字，注意要放在同一包下。在敲代码之前，先点击右上角的 pull “拉取” 按钮下载最新代码，再点击maven界面上的两个刷新按钮，下载依赖包。

```java
package com. merchants. port server controller. portquery:

//1、注释一定要写，方便以后查看。
/**
  * 大船船期信息
  * 
  * @author ex-hezhenghao001
  * @since  2020-06-08
  */
@SLf4j
@Api(tags =＂大船船期值息＂)
@RestController  //2、修改路径
@requestMapping("/portBigShipment")
public class PortBigShipmentController { 

   @Autowired //9、Controller层写完了，然后我们到服务层。
   private PortBigShipmentService portBigShipmentService;
    
   @ApiOperation("大船船期信息查询")//3、修改swaager的显示信息。
   @PostMapping(value ="page") ///4、post提交，修改路径
   @AuthPermissions(needlogin = false)//5、这是权限控制注解，先标注为false关闭权限控制。后面再配权限字段。
   public ResultBase<PageResp<BigShipmentQueryResp>> page //6、ResultBase<T>是封装"code""msg""data"的实体类，用来封装data返回数据。其中类形参是泛型，data<T>类型也为泛型，所以可以直接写成这种格式直接封装。PageResp<>是封装了"pageNum""pageSize""pages""count"，。然后根据需求页面的响应参数和请求参数，创建响应参数实体类和请求参数实体类，并写好对应的字段。响应类和请求类在API项目模块下。
     (@RequestBody @Validated PageReq <BigShipmentQueryReq> pageReq) {
     Log.info(＂大船船期分页查询，入参: pageReq={｝＂，JS0N.toJSONString( pageReq);//7、日志语句，{} 符号可以有效避免提前进行字符串拼接而浪费性能。打印多个参数，添加多个大括号即可，{}{}{}。
     PageResp<BigShipmentQueryResp> pageResp = portBigShipmentService. pageQuery(pageReq);                                                          return ResultUtil.ok(pageResp);//8、把返回结果封装。（写个工具类ResultUtil调用ok（）方法，里面是用ResultBase结果出参类的有参构造方法，创造出结果对象，顺便把成功编号，成功信息，结果数据都封装进结果对象了，最后返回。厉害了！）
}
              
```

##### Entity层:

- 承接上面第6步：在同一包下，复制别人的响应参数实体类和请求参数实体类，改好名字。

```java
/**
  * 大船船期信息列表查询入参 //1、写好注释。
  * 
  * @author ex-hezhenghao001
  */

@Data //2、lombok插件的注解，可以省略Setter和Getter。
@Accessors(chain = true)
@EqualsAndHashCode(callSuper= false)
@ApiModel( description=＂大船船期信息列表查询入参)//3、修改swaager信息。
public class BigShipmentQueryReq {

  /**
    * 船名  //4、这个字段注释是写给我们后端看的。下面的swaager信息才是写给前段看的。
    */
  @Apimodelproperty(＂船名＂)
  private String avesselname; //5、根据需求页面的请求参数条件，对照数据库的字段名.注意字段类型也要仔细对好。（类型，字段名 类型，字段名 类型，字段名。）有枚举值的也要写到注释上去。。

  /**
    * 船代码 
    */
  @Apimodelproperty(＂船代码＂)
  private String evesselname;

    ......
        
  /**
    * ETA开始时间 //6、（1）需求页面里的的ETA请求参数会输入两个时间。可是数据库却只有一个字段，这该怎么对应起来？ 其实可以写一个Start开始时间和一个End结束时间，在sql的where子句里用ETA字段大于等于开始时间，小于结束时间即可！
        （2）LocalDateTime 类型是线程安全的。
    */
  @JsonFormat(pattern =＂yyyy-mm-dd HH: mm: ss＂)
  @ApimodelProperty(＂ETA创建时间 - 开始(年月日)＂)
  private LocalDateTime etaStartTime;

  /**
    * ETA结束时间
    */
  @JsonFormat(pattern =＂yyyy-mm-dd HH: mm:ss＂)
//@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
//在实体类的日期属性上，我们需要加上@JsonFormat注解，利用它的pattern属性来进行时间的格式化，利用timezone属性来解决时差问题。“GMT+8”表示我们在东八区，不然我们收到前端传来的时间有可能相差8个小时。        即列表数据与数据库的时间不一致，晚了8小时，在查询接口的出参实体字段中添加此注解即可。
  @ApimodelProperty(＂ETA结束时间 - 结束(年月日)＂)
  private LocalDateTime etaEndTime;
  
    ......
```



#### （2）Service层：

##### Intervice：

在同一包下，复制别人的 Interface 文件和 service 文件，改好名字。

```java
package com. merchants.port.server.service.portquery;
/**
  * 大船船期信息服务类   //1、写好注释。
  * 
  * @author ex-hezhenghao001
  * @since  2020-06-08
  */     //2、Iservice<> 这是Mybatis Plus的基础类，封装了很多方法。这里还要写一个 BigShipment 表格实体类。字段跟表格的字段名完全一致，因为后面xml语句里会把从数据库查询出来的结果封装到这个表格实体类里。（最好不要修改这个表格实体类里面的字段名。不然别人查看你的代码会找半天。）
public interface PortBigShipmentService extends Iservice<BigShipment>{

    /**
      * 列表分页查询
      *
      * @param pageReq
      * @return
      */
 PageResp<BigShipmentQueryResp> pagequery(PageReq<BigShipmentQueryReq> pageReq);

}
```

##### Impl：

```java
package com. merchants.port.server.service.portquery.impl; //1、这里显示java文件的绝对路径，如果要修改某个文件，去掉名字后加个小点. ，就会跟方法一样，显示出文件名来。

/**
  * 大船船期信息结果表 服务实现类  //2、写好注释
  *
  * @author ex-hezhenghao001
  * @since 2020-06-08
  */
@Service  //3、ServiceImpl 是Mybatis Plus的。复制别人的 xxMapper文件修改好名字，写上我们的表格实体类。
public class PortBigShipmentServiceImpl extends ServiceImpl<PortBigShipmentMapper，BigShipment> implements
   Portbigshipmentservice {
    
    @Autowired  //4、复制并改好mapper，然后写上我们的xxxMapper名字。
    private PortBigShipmentMapper mapper;
    
    @Autowired  //5、复制并改好mapping，然后写上我们的xxxMapping名字。
    private PortBigShipmentMapping mapping;

    @Override
    public PageResp<BigShipmentQueryResp>
        pageQuery(PageReq<BigShipmentQueryReq>  pageReq) {
        //6、Ipage 和 PageHelper 类都是分页辅助类，固定写不用变。this.mapper 估计是Mybatis Plus的写法。直接调用Mapper接口里的方法，在xml里写好sql语句就会自动返回响应数据。不用我们再去写接收数据的代码，也不用写Dao层！
       Ipage<BigShipment> page = this.mapper.pageQuery(PageHelper. setPage(pageReq), pageReq.getTemplate());
       List<BigShipmentQueryResp> queryResps = this.mapping. entityToResp(page.getRecords()); //7、对查询的返回结果调用entityToResp（）方法， 数据库实体 转出参实体。就可以把从数据库查询出来数据封装到我们的响应参数实体类上了。
       return PageHelper.wrapPage(page, queryResps);//8、封装页数，页码和返回结果。
}
```

##### 问答：

> 承接上面第7步里的 entityToResp方法，为什么要用这个方法转来转去呢？
>
> 如果直接丢dto里的响应实体类，前端是看不懂的，因为表格实体类里的字段里都没加swaager注解。所以要转一下。让前端通过swaager看得懂字段意思。。体现了前后端分离开发。如果一个人开发，肯定是直接丢响应参数出去。
>
> 问：查询的这么多列表数据，返回参数怎么给到前端去展示的？ 
>
> 答：数据库查出来多条数据，装到list里面。然后返回给前端。前端会去遍历我们的list，再展示出来。



#### （3）Mapper层：

在同一包下，复制并修改好别人的mapper层。

```java
package com. merchants.port.server.service.portquery.impl; 

/**
  * 大船船期信息结果表 Mapper 接口  //1、写好注释
  *
  * @author ex-hezhenghao001
  * @since 2020-06-08
  */
public interface PortBigShipmentMapper extends BaseMapper<BigShipment>{
    
   IPage<BigShipment> pageQuery(IPage<?> page, @Param('req') 
                                BigShipmentQueryReq req);    
}
```

##### Xml：

在同一包下，复制并修改别人的xml文件。

```java
<? xml version=“1.0 encoding=＂UTF-8＂>
<IDOCTYP mapper Public "-//mybatis.org//DTD mapper 3.0//En"
 "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.merchants.port.server.mapper.portquery PortBigBhipmentMapper">   //1、mapper文件权限定名别写错了，不然扫描不到这个mapper文件下的方法。

  ＜!--通用查询映射结果--> //2、表格实体类的权限定名别写错了。这里就是把返回结果封装到表格实体类中。所以下面的表格字段跟表格实体类的字段要一一对应好。
  <resultmap id=baseResultMap
  "type="com.merchants.port.server.entity.portquery.BigShipment">
  <result column="berthplanno"  property="bigshipid"/> //3、这里就修改了ID字段名，最好不要这样用。
  <result column="avesselname" property="avesselname"/>
  <result column="evesselname" property="evesselname"/>
  <result column="owner" property="owner"/>
  <result column="imo" property="imo"/>
  result column="inboundvoy" property="inboundvoy"/>
     ......
  </resultmap>

  <!--通用查询结果列--＞ //4、写好Mybatis的<sql>标签，方便下面引用。需要什么字段，就把相对应的表格的字段名字写上，不用全都写。也可以全部都写，下面再加个 <!--分页查询列-->即可。这一步就要仔细看看字段有没有枚举值了。。有就用CASE...WHEN...语法加上去。
  <sql id = "Base_Column_List">
    avesselname, berthplanno, evesselname, owner, imo......
  </sql>
  
  <sql id = "groupby_Column_List"> //5、写好分组去重的字段列表。。这里就不用写枚举值了。
    berthplanno,
    avesselname,
    evesselname,
    owner,
    imo,
    inboundvoy,
    outboundvoy,
    ......
   </sql>
  
  <!--表名--> //6、写好表名的sql标签。
  <sql id="table">
    block_record_ship_shipment
  </sql>
  
  <select id="pageQuery"  resultMap="BaseResultMap"> //7、select标签的id跟mapper的方法名一模一样。说明mapper方法调用的就是这个id名下的sql语句查询数据库。 防止数据库字段跟实体类字段名不一致，用resultMap来对应字段。
    select
    <include refid="Base_Column_List /> //8、把具体字段列表id引入。
    group_concat(containerowner order by containerowner) containerowner //9、Mybatis函数group_concat（）的作用是将group by产生的同一个分组中的值连接起来，返回一个字符串结果。因为数据结构变了，大船船期表会一条船有多条数据。但是需求页面的列表数据，需要对其它有重复值的字段进行去重，变成一条数据，而箱主有多个，就用到此函数。
      from
    <include refid="table" /> //10、把表名引入。
      <where> 
      <if test="req.avesselname != null and req.avesselname != ''">
          and avesselname like concat('%',#{req.avesselname}, '%')//11、用if判断语句写入多个请求条件。最好全部都做模糊查询，比如输入框太小，全名可能都写不下，如果用精确查询可能会查不到。所以最好用模糊查询like concat。
      <if test="req.evesselname != null and req.evesselname != ''">
          and evesselname Like concat('%', #{req.evesselname}, '%')
      </if>
      <if test="req.owner != null and req.owner != ''">
          and owner like concat('%',#{req.owner}, '%')
      </if>
      ......
      <if test="req.etaStartTime != null"> //12、时间的入参条件写法。
          and eta_time >= #{req.etaStarTime}
      </if>
      <if test="req.etaEndTime != null">
          and eta_time < date_add（#{req.etaEndTime},interval 1 day）
      </if>
    </where>
    group by <include refid = "groupby_Column_List">  //13、去重。
    order by eta_time DESC  //14、对离港时间eta进行倒序排序，即可最接近现在时间的船数据排在最前面。
</select>
```



## 测试接口的方法：

代码写完了，先执行maven-clean-install命令。再Debug启动EurekaApplication模块和PortApplication模块的启动类。最后用swaager、postman、测试类来测试一下。有异常信息，可以用Debug打断点定位异常。

> 标机idea上的setting设置里的maven居然用的是电脑自带的默认maven，但是setting的位置和仓库却都是我自己新增加的。这样才能正确进行打包。这都行！
>
> 但是setting文件是公司前辈给的，环境都配置好了，比如有内网的镜像设置啊之类的。才不会出错。

-  swagger测试： 

  （1）如下图，在Google浏览器地址栏输入" http://localhost:8092/swagger-ui.html，打开后即可看到这模块项目下的各个接口信息。

> 1、localhost：本机的ip地址。可以在标机桌面的“网络参数.cmd” 文件中的“无线局域网适配器  WLAN -- IPv4 地址”中找到自己ip地址。
>
> 2、8092：项目的端口号。在source文件夹--application-dev.properties配置文件配置好了端口号。同时这配置文件下也有数据库的各项连接信息。
>
> 3、swagger-ui.html：不用加vue，因为没有加vue的依赖。
>
> 4、测试的时候把controller层的权限解开，输入 needlogin = false。就不会一直重复提示重新登陆。提交commit的时候记得把这个权限改回来。
>
> 5、测试的时候服务启动报错，rediscommandexecution: read only  you can't write against a read only salve;可以在dev配置文件中，把redis的地址设置成本机的127.0.0.1。然后启动下载好的redis，打开redis窗口界面即启动。也要打开redis desktop management 连接上这个redis才能打开swagger。别把改的redis地址给提交了。

![1592277540989](C:\Users\admin\Desktop\pingan\API-Development.assets\1592277540989.png)

（2）点击任意一个接口，展开后点击右上角的一个“Try it out”按钮，会看到请求参数输入框可以编辑了。利用 notepad++ 编辑软件帮助我们编辑参数。再点击“Execute”执行按钮，即可连接到我们的后台接口，传入请求参数开始走代码！

（3）往下拉看看响应参数是否“请求成功”，是否有从数据库查询出来的数据，有即成功。“查询接口”开发并自测完毕！最后把地址发给前端人员进行联调。。最后这就有点重要了，后端先自己自测好了，再交给前端去测试。减少大家的工作量。

> 问：1、怎么知道请求参数是否传入接口？ 
>
> 答：点击“Execute”执行按钮后查看idea控制台，是否有一行代码
>
> “ 大船船期分页查询，入参：pageReq={“template”：{“owner”：“”，“inboundvoy”：“”，...}，“pageSize”：10，“pageNum”：1}”，这就是我们那条log日志语句。有出现代表入参传入成功！



- postman测试：如下图，打开一个界面。选择post提交，输入地址和匹配路径。选择Body--选择raw--输入{请求参数}--选择JSON（application/json）格式--点击send按钮，即可开始测试。

![1592279068902](C:\Users\admin\Desktop\pingan\API-Development.assets\1592279068902.png)



- 测试类也就是在test文件夹下写测试类，创建参数，调用方法即可！

- 用前端的页面进行测试：

  （1） 叫前端人员连接自己本机的服务,发自己的服务地址和端口号给前端，比如开启港口的服务：http://10.118.114.85:8092（可以在cmd使用ping命令查看自己本机跟前端机器的连接情况）。

  （2） 再叫前端人员发他的IP地址：http://10.119.158.132:9528/merchants-port-server/sys/login。

  （3） 用港口的账户和密码登录即可查看前端的页面。按F12查看接口数据。

  也就是前端连后端的服务，后端再连前端vue框架的服务而已！

  （4）当前端开发更新了代码之后，后台需要Ctrl+Shift+Delete清除缓存，再刷新页面测试才行！



## 2、“详情”接口：

如下图，点击查询页面表格最右边的“详情”按钮即可跳转到这详情页面。

![1592279388261](C:\Users\admin\Desktop\pingan\API-Development.assets\1592279543403.png)

```java
/**分析详情页面：
    发现大部分“基本信息”，“船期信息”都可以从查询接口处直接拿到数据，也就是出参实体类里都有这些字段。只有“箱主信息”表格是多条数据，需要从数据库进行再查询。所以我们可以在Resp响应实体类里加个 "List<BoxOwnerResp>  owner" 箱主信息列表字段，在服务层通过sql语句查出箱主信息多条数据后用List<BoxOwnerResp>类型接受，最后调用响应实体类的setOwner（）方法，即可把多条数据封装到响应实体类的箱主信息列表字段中。这种把基本类型，字段，甚至实体类当做字段属性。。然后把这些结果用set方法封装起来。这开发思想利用了实体类的属性封装特性，也充分体现了万物皆对象的赶脚。*/
```



#### （1）controller层：

在同一包下，复制修改别人的代码，在“查询”方法下接着写“详情”方法。

```java
    @GetMapping(value = "detail/{bigshipId}")//1、get提交，修改路径、返回ID名称。（跟前端商量后，返回ID会在前面查询接口的返回参数里给他！他再传给我，我再根据这ID去查询数据库。这应该是固定的开发方法！）
    @Api0peration("获取大船船期信息详情＂) //2、修改swaager信息。
    @AuthPermissions(needlogin = false)
    public Resultbase<BigShipmentQueryResp> detail //3、出参实体类增加个"List<BoxOwnerResp>  owner" 箱主信息列表字段。方便我们查出数据直接封装到出参类里。
  (@PathVariable("bigshipid") @ApiParam("主键ID") BigDecimal bigshipId){ //4、第一个注解是把从地址中传递过来的参数传入到这方法变量中。第二个注解是swaager信息。修改参数类型和名字。
    Log.info(＂获取大船船期信息详情，入参: depend={}＂,JS0N.toJSONString(bigshipId)); 
    BigShipmentQueryResp resp=portBigShipmentService.detail(bigshipId);//5、传入ID，调用服务层方法，返回结果。
    return ResultUtil.ok(resp); //6、封装结果。
 }
```



#### （2）service层：

##### Intervice：

在同一包下，复制修改别人的代码，在“查询”方法下接着写“详情”接口。

```java
/**
  * 查看详情 //1、写好注释
  * 
  * @param bigshId
  * @return 
  */           
BigShipmentQueryResp detail(BigDecimal bigshipId);//2、修改出参类和参数。
```

##### Impl：

在同一包下，复制修改别人的代码，在“查询”方法下接着写“详情”方法。

```java
  @Override  
  public BigShipmentQueryResp detail( Bigdecimal bigshipId) {//1、修改出参类、参数类型、名字。
    BigDecimal id = Optional.ofNullable(bigshipId).orElseThrow( () -> ServiceException.of(Exceptionenum.NULL_ID)); //2、修改id接收类型，这步是对ID的非空判断，避免参数为空，导致结果为空而报空指针异常。方法的参数传进来，都要判断判断是否为空为null！
    BigShipment dto =this.mapper.selectdetailbyid(id); //3、修改表格实体类的接收类型，在mapper文件中一并修改方法中的id参数类型。传入id，调用mapper接口方法。这里是把从数据库查询到的"基本信息""船期信息"都查询出来了，然后封装到BigShipment实体类中，只有一条数据。
    List<OwnerInfo> op = this.ownerInfoMapper.selectDetailByOwner(dto.getBigshipId());//4、新创建Mapper文件、OwnerInfo表格实体类。在mapper文件中新增此方法，传入"ID"参数，字符串类型。这是把从数据库查询到多条"箱主信息"数据封装到集合list中。（有点神奇，只需要调用mapper接口，就可以把数据添加到list中。不用写变量接收数据库的数据，不用写list的add（）方法添加数据。可能因为mybatis-plus与spring boot集成了，只需要继承iservice和basemapper就可以不用写xml文件，直接输出结果。大大节省时间。）。
    return this.mapping.entityToResp(dto).setOwnerInfo(this.ownerInfoMapping entityToResp(op));//5、新增mapping文件，调用entityToResp（）方法。出参类调用setOwnerInfo（）方法把列表数据对象存入列表字段中。
}
```

##### 问答：

> 问：能不能共用同一个mapping文件的entityToResp（）方法呢？
>
> 答：不能。因为如下代码框 mapping文件下接口继承的基础类里有一个表格实体类是唯一的。所以从不同的数据库表格去查询出来的数据不能复用entityToResp（）方法，只能重新创建。
>
> 问：实体类一定要跟对应的数据库表一样，必须列出所有字段才能映射结果吗？
>
> 答：可以不用。就像上面的OwnerInfo表格实体类，只放入了“箱主”，“操作”，“截单时间”三个字段，也可以跟数据库表 block_record_ship_shipment映射。



```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PortBigShipmentMapping 
    extends BaseMapping<BigShipmentQueryReq, BigShipmentQueryReq, BigShipment, BigShipmentQueryResp>{
    
}
```



#### （3）Mapper层：

在同一包下，复制修改别人的代码，在“查询”方法下接着写“详情”接口。

PortBigShipmentMapper.java :

```java
BigShipment selectDetailById( @Param('bigshipId') BigDecimal bigshipId );//修改接收类型和参数类型。
```

新增 PortBigShipmentOwnerInfoMapper.java :

```java
List<OwnerInfo> selectDetailByOwner( @Param('berthplanno') String berthplanno );//修改接收类型、方法名、参数名、参数类型。    
```



##### Xml：

在同一包下，复制修改别人的代码，在“查询”方法下接着写“详情”的sql语句。

```java
<sql id="..."> //1、写好详情页的字段列表。
   ...
</sql>

<sql id="table">
    block_record_ship_option //2、写好表格名称。
</sql>

<sql id="table_left">
    <include refid = "table" /> opt
    LEFT JOIN (select berthplanno,owner,cvesselname,avesselname,agent,barge_tel,imo 
    from block_record_barge_shipment
    group by berthplanno,owner,cvesselname,avesselname,agent,barge_tel,imo
    ) bar on opt.berthplanno = bar.berthplanno
</sql> //3、写好连表语句，这里用了去重的结果域作为左连接表。。为啥要去重呢？因为要考虑另一张表的数据会不会重复？

<!--详情-->  //4、做好注释。
<select id="selectDetailbyId" resultmap="BaseResultMap"> //5、方法名写正确。
    select
     <include refid="Base_column_list"/>
     group_concat(containerowner order by containerowner) containerowner //6、箱主用函数表示。
    from
  <include refid="table"/>
  <where>
    <if test="bigshipId != null"> 
      and berthplanno = #{bigshipId} //7、写好请求条件。
      </if>
   </where>
    group by <include refid = "groupby_Column_List"> //8、去重。
</select>
```

###### 新增PortBigShipmentOwnerInfo.xml：

```java
  ＜!--通用查询映射结果--> //1、映射结果只需要写这三个字段即可！
  <resultmap id="baseResultMap" type="com.merchants.port.server.entity.portquery.OwnerInfo">
  <result column="containerowner"  property="containerowner"/> 
  <result column="ultype" property="ultype"/>
  <result column="closecarbintime" property="closecarbintime"/>
  </resultmap>

  <!--详情箱主信息表查询结果列--＞
  <sql id = "Base_Column_List">
    containerowner, (CASE ultype WHEN 'U' THEN '卸船' WHEN 'L' THEN '装卸' ELSE ultype END)ultype, closecarbintime   //2、如果需求文档里的某些列表字段有枚举值，就需要用到CASE..WHEN...THEN...函数去表示相对应的意思。如果有连表。。。需要把连表别名字段写在CASE内。
  </sql>
 
  <!--表名--> //3、写表名。
  <sql id="table">
    block_record_ship_shipment
  </sql>
  
  <!--详情-->
  <select id="selectDetailByOwner"  resultMap="BaseResultMap"> 
    select
    <include refid="Base_Column_List /> 
      from
    <include refid="table" /> 
      <where> 
      <if test="berthplanno != null and berthplanno != ''">
          and berthplanno = #{berthplanno}  //4、写请求条件。
      </if>
    </where>
      order by containerowner  //5、按照箱主来分组。
</select>
```

最后测试一下，页面数据是否正常显示。显示异常就去控制台查看异常日志。或打断点看一看异常原因。没问题，则详情接口开发完成！



## 3、“下拉框”接口：

如下图，需要下拉框查询条件的有“船东”，“箱主“两个字段。

![1592191699077](C:\Users\admin\Desktop\pingan\API-Development.assets\1592191699077.png)



#### （1）Controller层：

复制修改别人的代码，在“详情”接口下继续写“下拉框”接口代码。

```java
@GetMapping(value = "getDropBoxData") 
@Api0peration("获取大船船期--查询页面的查询条件下拉框数据＂)
@AuthPermissions(needlogin = false)
public Resultbase<BigShipmentQueryDropBoxResp> getDropBoxData (){ //1、创建下拉框出参实体类。
  Log.info(＂获取查询页面的查询条件下拉框数据，入参:＂); 
    BigShipmentQueryDropBoxResp resp= portBigShipmentService.getDropBoxData(); //2、修改接收类型和方法名。
    return ResultUtil.ok(resp); //3、封装结果。
 }
```

##### Entity层：

- 承接上面的第一步：下拉框出参实体类。

  ```java
  /**
    * 大船船期信息列表查询，查询条件下拉框数据出参，每个字段表示一个对应的下拉框数据 
    * @author ex-hezhenghao001   
    */    //1、写好注释。
  
  @Data 
  @Accessors(chain = true)
  @EqualsAndHashCode(callSuper= false)
  @ApiModel( description="大船船期信息列表查询，查询条件下拉框数据出参，每个字段表示一个对应的下拉框数据" )
  public class BigShipmentQueryDropBoxResp {
  
    /**
      * 船东
      */
    @Apimodelproperty(＂船东＂)
    private List<DropDownBoxResp> owner; 
  
    /**
      * 箱主 
      */
    @Apimodelproperty(＂箱主＂)
    private List<DropDownBoxResp> containerowner; //2、有几个下拉框，就写几个字段。而且这些字段的类型都是集合类型。。集合里存放的对象类型还是一个实体类，所以我们还得新建一个实体类。
  
  }
  ```

- 新建“基本下拉框数据出参”：

  ```java
  /**
    * 下拉框数据出参
    * @author ex-hezhenghao001   
    */    //1、写好注释。
  
  @Data 
  @Accessors(chain = true)
  @EqualsAndHashCode(callSuper= false)
  @ApiModel( description="基本下拉框数据出参" )
  public class DropDownBoxResp {
  
    /**
      * 下拉框选项值
      */
    @Apimodelproperty(＂下拉框选项值＂)
    private String value; 
  
    /**
      * 下拉框选项名称 
      */
    @Apimodelproperty(＂下拉框选项名称＂)
    private String name; //2、下拉框选项值为什么需要两个字段来表示呢？  下拉框其实返回的是一个个数组，返回List<>其实就是数组。数组里是多个下拉框数据。一个value值一个name值，就像一个名字有个id值对应着一样。
  }
  ```

  

#### （2）Service层：

##### Intervice：

复制修改别人代码，在“详情”接口下接着写“下拉框”接口。

```java
/**
  * 获取下拉框数据
  * @return
  */
BigshipmentQueryDropBoxResp getDropBoxData();
```

##### Impl:

```java
@Override
public BigShipmentQueryDropBoxResp getDropBoxData(){
  BigShipmentQueryDropBoxResp resp = new BigShipmentQueryDropBoxResp();
    resp.setOwner( //1、创建大船船期信息查询下拉框出参类对象，再调用set（）方法保存下拉框列表数据。
        getDropDataFromTable(BigShipmentQueryEnum.OWNER.getValue(), BigShipmentQueryEnum.OWNER.getName())); //2、调用getDropDataFromTable（）方法，传入枚举类里定义的船东value值和船东name值。（当要传几个常量的时候就可以使用枚举类。）
    resp.setContainerowner(
        getDropDataFromTable(BigShipmentQueryEnum.CONTAINER_OWNER.getValue(),
BigShipmentQueryEnum.CONTAINER_OWNER.getName()));//3、调用getDropDataFromTable（）方法，传入枚举类里定义的箱主value值和箱主name值。
    return resp;

@Override
public List<DropDownBoxResp> getDropDataFromTable(String value, String name){ //4、编写方法，返回值类型为基本下拉框实体类型集合，形参为两个string值。
    List<DropDownBox> List =  mapper.queryDropBoxDataList(value, name); //5、调用方法，从数据库取出下拉框选项值的数据集合。用下拉框实体类DropDownBox为集合类型接收，当然要先创建这表格实体类（这实体类就是没有加swagger注解而已，其它跟基本下拉框实体类一样。这里的表格实体类才两个字段，也说明了表格实体类不用非得跟数据库的表一样一一对应并写出所有的字段）。
    return  dropBoxMapping.entityToResp(List); //6、创建专属的Mapping文件，调用数据库转实体方法。最后返回结果即可。
}
```

- 承接上面第二步：枚举类。

  ```java
  /**
    * 下拉框查询枚举
    * @author ex-hezhenghao001
    */
  
  @Getter
  public enum BigShipmentQueryEnum {
     OWNER( "owner"，"owner"，"船东"),
     CONTAINER_OWNER( "containerowner","containerowner＂,＂箱主＂)
                     
     private String value;
     private String name;
     private String desc:
                     
     BigShipmentQueryEnum(String value, String name, String desc){
      this.value = value;
      this.name = name;
      this.desc = desc;
     }
  }
  ```

- 承接上面第6步：mapping文件。

  ```java
  @Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
  public interface DropBoxMapping 
      extends BaseMapping<DropDownBoxResp, DropDownBoxResp, DropDownBox, DropDownBoxResp>{
      
  }//1、修改类名和实体类名。原来全部是出参实体类也是可以的！不一定两个就是要入参实体类。
  ```



#### （3）Mapper层：

在“详情”接口下接着写“下拉框”接口代码：

```java
List<DropDownBox> queryDropBoxDataList(@Param("value")String value, @Param("name")String name);
```

##### xml: 

同一文件下。

```java
＜!--下拉框数据查询-->
<select id="queryDropBoxDataList" resulttype=com.merchants.port.server.entity.common. Dropdownbox"> //1、修改方法名，表格实体类的权限定名。
  select
    distinct ${value} value, ${name} name //2、字段列表为传入方法的参数，再赋予别名。
  from
  <include refid="table"/>
  <where>
      ${value}! = '' //3、判断不为空。
  </where>
  </select> //4、所以下拉框的各个选项值就是从数据库里查询出来然后去重之后得到的！
```

用前端页面测试一下，下拉框能出来选项值数据。。则下拉框接口开发成功！

##### 问答

> 问：下拉框接口只有一个接口，那查询条件处有这么多下拉框怎么分配这个接口呢？
>
> 答：前端可以从这一个接口里取到所需的数值。就像详情页面，前端可以从查询接口获取主键Id再返回给我们。所以，前端可以从别的接口处获取数据。只要在一个controller文件下的接口应该都可以。





## 4、驳船船期信息“查询”接口：

#### xml：

```java
<!--通用查询结果-->
<resultMap id="BaseResultMap" type="com.merchants.port.server.entity.portquery.BargeShipment">
    <result column="berthplanno" property="berthplanno" />
    <result column="cvesselname" property="cvesselname" />
    ......
    <result column="error_msg" property="errorMsg" />
    
    <result column="vesseltype" property="vesseltype" />
    <result column="f20B" property="f20B" />
</resultMap>  //1、写结果映射ResultMap时，当不是表中的字段或者添加另一表中的字段时，直接空格，然后写上字段即可。。下面写sql语句作连表查询时，它会自动找到另一张表的字段做结果映射，不用写其它配置去分辨哪一张表的结果数据映射哪一张表的字段。
    
<select id="pageQuery"  resultMap="BaseResultMap">
 select tmp.*,
        (select distinct sh.vesseltype from block_record_ship_option sh where sh.berthplanno=tmp.berthplanno) vesseltype  //2、直接用这种写法，就不用连第二张表，也可以得到第二张表的数据。两个数据库别名还是要有的。
 from (  
   select
      <include refid="query_Column_List />,
      group_concat(containerowner order by containerowner) containerowner  
   from
   <include refid="table" />
   <where>
        <if test="req.cvesselname !=null and req.cvesselname !=''">
            and cvesselname =#{req.cvesselname}
        </if>
        ......
      </where>     
      group by <include refid="groupby_Column_List"/> //3、把去重的结果当成一个结果域，再去域里查询数据。
      ) tmp
     order by tmp.eta_time desc, tmp.hotbox desc
 </select>
```



## 5、驳船报道信息“查询”接口：

#### xml：

```java
<!--分页查询结果列-->
<sql id="query_Column_List">
     tab.avesslname,
     tab.inboundvoy,
     tab.outboundvoy,
     '' reportingLocation,   //1、准备查询字段列表。可以用单引号表示一个字段为空。写在<sql>标签下，别卸载<select>标签下。当数据库还未有此字段，就可以用此方法先添加上去。不过这些无法从表中查询的字段都要写在word文档里面，好后面做统计。也可以直接 null reportingLocation 这样写！
     '' reportingTimeDistance,
     bs.owner,
     bs.imo,
     bs.hotbox
  </sql>

<!--列表分页查询-->
<select id = "pageQuery" resultMap = "BaseResultMap">
    select
        <include refid="query_Column_List" />
    from <include refid="table" /> tab,
        (SELECT DISTINCT
            avesselname,
            inboundvoy,
            outboundvoy,
            OWNER,
            imo,
            hotbox,
            barge_tel,
            bargefeetype
          FROM
            block_record_barge_shipment) bs  //2、可以把去重之后的结果域当成第二张连接表来查询。
     <where>
          ......
```



## 6、如何部署测试环境（平安云）？

（1）后端默认只是更新jar包（打包），如果更新config，执行SQL，需要跟@杨杨 额外说明的，群里@杨杨一下。

1、执行maven命令，打包jar包。

2、在如下的项目路径找到jar包所在位置。把target下新打的包放入如下位置，并改为一样的包名。

3、最后发如下文字到群里即可!

```java
部署招商和江门两个港口后端：                                       
szm_cpp/doc/1.0.0/pa-stg/merchants-port-server/jm/back/merchants-port-server-jm-1.0.0.jar
szm_cpp/doc/1.0.0/pa-stg/merchants-port-server/scct/back/merchants-port-server-scct-1.0.0.jar

执行两个dml脚本：
szm_cpp/doc/1.0.0/pa-stg/merchants-port-server/jm/dml/06_jm_insert_user_resource.sql
szm_cpp/doc/1.0.0/pa-stg/merchants-port-server/scct/dml/05_scct_insert_user_resource.sql
```

（2）用svn部署测试环境。

1、打包。

2、找到此路径下的港口jar包位置，用新包复制粘贴到svn的project下，再改相同名字。D:\Users\EX-HEZHENGHAO001\pingan\svn\project\szm_cpp\doc\1.0.0\pa-stg\merchants-port-server\scct\back。

3、右键点击svn commit，即可完成提交。

4、最后发如下文字到群：

@all
平安云测试jar包，从git已移交svn，请知悉！
http://ftqsh-d5113.paicdom.local:8080/svn/Blockchain/招商港口/project/szm_cpp/doc.



> 在本地Navicat软件里，选择所需的表格全选-右键-复制为sql语句。粘贴在云上的navicat测试环境去执行脚本。



## 7、如何快速新建一个项目：

新建一个项目，先弄好项目环境，配置文件只看需要的，dev.properties 里的本地开发环境的端口号，数据库，redis服务地址和eureka注册地址。还有prd，stg，uat。基本是复制粘贴。



## 8、比较语句：

#### if（）判断格式下：

##### 1、字符串和BigDecimal类型的比较。

```java
//背景：前端页面-新增用户-输入手机号码。输入的手机号码字符串如果为空值，就返回异常。
答：一直用null，用""去比较，都一直比较不出来，所以没必要死磕。直接换个思路，写手机号码包含" "（中间要加空格）空字符串即报错。 手机号码输入空值是允许的。
```

##### 2、bigdecimal跟零的比较。

```java
//背景：工作台的统计结果为百分数的时候，除数可能为0，会报除数为零的异常错误。所以对除数变量作判断，如果为零，整个结果直接返回0.

答：0可能是long类型，可能是int类型。所以 bigdecimal.equals(0) 一直都比较不出来。我们直接用对象跟对象比较 BigDecimal.equals(new BigDecimal（0）) 即可！
//或者
compareTo（new BigDecimal（0））==0 写法也可！
```

























