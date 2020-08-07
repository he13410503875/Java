# 进口流程（包含集装箱综合信息）API-Development 01

根据需求页面编写  集装箱综合信息  “查询”  接口页面和  “下拉框”  选项接口和“详情”接口页面。

![1](..\pingan\API-Development-ContInfo.assets/1.jpg)

### 查询接口：

#### Xml层：

分析业务需求：集装箱综合信息的列表查询应该是要把“招商港口”，“江门港口”的船数据全都给展示出来才对！所以需要对两个不同港口进行数据合并再展示出来。

##### select语句：

```java
<!-- 列表分页查询，集装箱操作信息表只取操作时间最近的一条记录，船作业信息表只取靠泊时间最近的一条记录-->
<select id="pageQuery" resultMap="BaseResultMap"> //1、写好方法名。
	select * from (
		select <include refid="query_Column_List" /> from block_record_cont_info tab //2、写好主表，从箱业务信息表里获取数据。
		
		left join (select containerno,do,max(opttime) opttime from <include refid="cont_optin_table" /> opa
		where opttime is not null group by containerno,do) rco
		on (tab.containerno=rco.containerno and tab.do=rco.do) //3、关联集装箱操作信息表，根据opttime字段获取操作时间离现在最近的进口/出口数据，去重。用集装箱号和象征进口的提运单号关联。
    
    	left join <include refid="cont_optin_table" /> op
    	on (op.containerno=rco.containerno and op.opttime=rco.opttime) //4、又关联集装箱操作信息表，上面的关联是确定了数据都是操作时间离现在最近的数据。现在用集装箱号和操作时间又关联一次，为了把集装箱操作信息表里其它字段的内容也展示出来，而且也全都是操作时间离现在最近的数据。 还能这样关联表，犀利，犀利！！
    
    	left join (select <include refid="ship_shipment_Clolumn_List" />
        from block_record_ship_shipment rss where creator_org_id='SCCT' group by <include refid="ship_shipment_Clolumn_List" />) ss 
        on (ifnull(tab.inowner,'')=ifnull(ss.owner,'') and tab.invesselname=ss.avesselname and tab.inboundvoy=ss.inboundvoy) //5、关联数据源是“招商港口”的大船船期表，去重。用船公司，船名，进口航次关联。船公司在平安云测试环境为空，一旦关联条件用船公司字段数据都会为空。所以用ifnull（）解决。
    
    	left join (select <include refid="barge_shipment_Clolumn_List" />
         from block_record_barge_shipment rbs where creator_org_id='SCCT' group by <include refid="ship_shipment_Clolumn_List" />) bs 
         on (ifnull(tab.outowner,'')=ifnull(bs.owner,'') and tab.outvesselname=bs.avesselname and tab.outboundvoy=bs.outboundvoy)  //6、关联数据源是“招商港口”的驳船船期表，去重。用船公司，船名，出口航次字段，数据源是“招商”的业务信息表用二程船公司，二程船名，二程船航次字段作关联。船公司在平安云测试环境为空，一旦关联条件船公司字段数据都会为空。所以用IFNULLL()解决。
    
    	left join (select <include refid="barge_shipment_Clolumn_List" />
         from block_record_barge_shipment rbs where creator_org_id='JM' group by <include refid="ship_shipment_Clolumn_List" />) bsjm 
         on (ifnull(tab.outowner,'')=ifnull(bsjm.owner,'') and tab.outvesselname=bsjm.avesselname and tab.outboundvoy=bsjm.inboundvoy) //7、关联数据源是“江门”的驳船船期表，去重。用船公司，船名，进口航次字段。数据源是“招商SCCT”的业务信息表用二程船公司，二程船名，二程船航次字段作关联。
    
 /*   	left join block_record_barge_cfmeta bc
    	on (bc.avesselname=bs.avesselname and ifnull(bc.inboundvoy,'')=ifnull(bs.inboundvoy,'') and ifnull(bc.outboundvoy,'')=ifnull(bs.outboundvoy,'')) //8、关联“驳船报道”表，用上面数据源为“招商港口” 的 “驳船船期表” 的船名，进口航次，出口航次关联。有可能一个为空， 一个不为空，或两个都为空，两个都不为空。所以都用ifnull（）。 (关联这张表后，列表会出现重复列数。所以注释掉)*/
    
    	left join (select berthplanno,avesselname,inboundvoy,outboundvoy,creator_org_id,max(atb_time) atb_time 
    	from block_record_ship_option
    	where atb_time is not null group by berthplanno,avesselname,inboundvoy,outboundvoy,creator_org_id) rso
    	on ((rso.avesselname=op.avesselname and rso.inboundvoy=op.boundvoy and rso.creator_org_id=op.op.creator_org_id)
           or(rso.avesselname=op.avesselname and rso.outboundvoy=op.boundvoy and rso.creator_org_id=op.creator_org_id)) //9、关联“船作业信息”表，根据atb_time获取停泊时间离现在最近的数据，去重，用“集装箱操作信息”表的船名，进口航次或出口航次，数据源标志作关联。
    
    	left join block_record_ship_option brso on (rso.berthplanno=brso.berthplanno and rso.atb_time=brso.atb_time) //10、又关联“船作业信息”表，用上面的主键和靠泊时间作关联。
<where>
	tab.creator_org_id='SCCT' //11、where子句，主表的数据源是“招商SCCT”。
    <include refid='pageQueryWhere' /> //12、按需求加上入参查询条件。
</where> 

union all //13、上面的是进口的结果集，下面是出口的结果集，用union all 把结果集合并。
//要是有些字段阴差阳错地是不同的值怎么办？ 注意重点是它们是一样的表，字段属性全都是一样的。因此sql字段列表可以用同一份。要是有不同的值，比如：进口，出口。那刚好把它们全都展示出来。所以不用担心会有不同的值。

		select <include refid="query_Column_List" /> from block_record_cont_info tab //14、主表还是集装箱业务信息表。数据源是“江门”。
		
		left join (select containerno,do,max(opttime) opttime from <include refid="cont_optin_table" /> opa
		where opttime is not null group by containerno,do) rco
		on (tab.containerno=rco.containerno and tab.bl=rco.bl) //15、左关联集装箱操作信息表，根据opttime获取操作时间离现在最近的数据，关联条件变了，用表示出口的 提运单号 bl 字段作关联。 
//这种关联不就变成江门的出口了吗？是要用招商进口跟江门的出口的结果集合并吗？  可能没有特别的意义，就是想表示出口。从操作表中拿到出口的数据。
    
    	left join <include refid="cont_optin_table" /> op
    	on (op.containerno=rco.containerno and op.opttime=rco.opttime) //16、左关联集装箱操作信息表，关联条件不变。

    	left join (select <include refid="ship_shipment_Clolumn_List" />
        from block_record_ship_shipment rss where creator_org_id='SCCT' group by <include refid="ship_shipment_Clolumn_List" />) ss
        on (ifnull(tab.outowner,'')=ifnull(ss.owner,'') and tab.outvesselname=ss.avesselname and tab.outboundvoy=ss.outboundvoy)   //17、左关联大船船期表，关联条件变了。箱业务信息表用表示出口的 二程船公司，二程船名，二程船航次字段。 数据源为 “招商SCCT” 的大船船期表用船公司，船名，出口航次字段作关联条件。
        
  // 跟步骤五-在途运输监管-驳船报道的sql有何区别？ 
  // left join  block_record_cont_info tab on tab.outvesselname=br.avesselname and tab.outboundvoy=br.inboundvoy and tab.creator_org_id='SCCT' and br.creator_org_id='JM'         步骤五是驳船表先跟报道表关联，再跟业务信息表关联。步骤五是江门的数据，但还是数据源为“招商SCCT”的业务信息表用出口船名，出口航次字段。（因为进口流程整体来说还是招商港口。）数据源为“JM江门”的驳船报道表用船名，进口航次字段作关联条件。（因为用的是驳船在江门的报道信息。）
  // 这里跟上面的大船没啥好区别比较的。。因为一个是大船，一个是驳船报道。它主要跟下面这些驳船船期比较，但进口出口的写法又不一样。。以后再来看看哪个是对的。
    
    	left join (select <include refid="barge_shipment_Clolumn_List" />
         from block_record_barge_shipment rbs where creator_org_id='SCCT' group by <include refid="ship_shipment_Clolumn_List" />) bs 
         on (ifnull(tab.inowner,'')=ifnull(bs.owner,'') and tab.invesselname=bs.avesselname and tab.inboundvoy=bs.inboundvoy) //18、左关联驳船船期表，关联条件变了。数据源为“江门”的业务信息表用一程船公司，一程船名，一程航次。数据源为“招商”驳船船期表用船公司，船名，进口航次作关联条件。
        
    
    	left join (select <include refid="barge_shipment_Clolumn_List" />
         from block_record_barge_shipment rbs where creator_org_id='JM' group by <include refid="ship_shipment_Clolumn_List" />) bsjm 
         on (ifnull(tab.inowner,'')=ifnull(bsjm.owner,'') and tab.invesselname=bsjm.avesselname and tab.inboundvoy=bsjm.outboundvoy) //19、左关联驳船船期表，关联条件变了。
         //**01、问问用哥，这里是不是写错了？驳船江门应该用进口航次关联？上面的驳船招商应该用出口航次关联？
    
 /*   	left join block_record_barge_cfmeta bc
    	on (bc.avesselname=bs.avesselname and ifnull(bc.inboundvoy,'')=ifnull(bs.inboundvoy,'') and ifnull(bc.outboundvoy,'')=ifnull(bs.outboundvoy,'')) */
    
    	left join (select berthplanno,avesselname,inboundvoy,outboundvoy,creator_org_id,max(atb_time) atb_time from block_record_ship_option
    	where atb_time is not null group by berthplanno,avesselname,inboundvoy,outboundvoy,creator_org_id) rso
    	on ((rso.avesselname=op.avesselname and rso.inboundvoy=op.boundvoy and rso.creator_org_id=op.op.creator_org_id)
           or(rso.avesselname=op.avesselname and rso.outboundvoy=op.boundvoy and rso.creator_org_id=op.creator_org_id)) 
    
    	left join block_record_ship_option brso on (rso.berthplanno=brso.berthplanno and rso.atb_time=brso.atb_time) // 20、两次左关联船作业船期表，关联条件不变。
<where>
	tab.creator_org_id='JM' //21、where子句，数据源是“江门”。
    <include refid='pageQueryWhere' /> //22、按需求加上入参查询条件。
</where>
)tmp
<where>
	<if test="req.currentShipName != null and req.currentShipName != ''">
		and tmp.currentShipName = #{req.currentShipName}
    </if>
    ... = req.currentBoundvoy //23、"所在船名"，"所在船航次"字段在表里没有。只有通过上面关联表之后才会出来值。
    ... = req.owner //24、船公司，可能是为了航次，船名，船公司更对应查询条件。
    ... >= req.etaTimeStart //25、如下的操作时间和停泊时间也是拎出来对应查询条件吧。
    ... <  req.etaTimeEnd, interval 1 day
    ... >= req.atbTimeStart
    ... <  req.atbTimeEnd, interval 1 day
   </where>
   order by tmp.containerno
</select>
```



![1596627961000](..\pingan\API-Development-ContInfo.assets/1596627961000-1596628010537.png)

##### Response出参字段列表：

```java
<sql id="query_Column_List">
	tab.containernid, tab.containerno, tab.bl, tab.do, tab.containertype,
	tab.containersize, tab.tareweight, tab.maxweight, tab.containerowner
	(CASE tab.inaim WHEN 'I' THEN '进口' WHEN 'E' THEN '出口' WHEN 'T' THEN '国际中转' WHEN 'D' THEN '国际中转' ELSE tab.inaim END) inaim,
	tab.inowner, tab.invesselname, tab.inboundvoy, tab.pol, tab.tpod,
	tab.outowner, tab.outvesselname, tab.outboundvoy, tab.pod, tab.finalport
	op.isdamage, (CASE...)op.emptyfull,...isloadflag,

	(CASE op.opttype WHEN '装船' THEN '在船' WHEN '出闸' THEN '出闸' ELSE '在场箱' END) currentStatus，
	（CASE WHEN tab.busi_type='export' THEN '出口' WHEN tab.busi_type='import' THEN '进口' ELSE null END) importExportFlag,  //1、如上需求页面的响应列表。“进口/出口”是根据业务表进出口类型字段“busi_type”的取值去判断的。

	( CASE (CASE op.opttype WHEN '卸船' THEN '在场' WHEN '入闸' THEN '在场' WHEN '出闸' THEN '在场' ELSE '在船' END)
       WHEN '在船' and tab.busi_type='import' THEN (
       		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.avesselname
            ELSE ss.avesselname END 
       )
       WHEN '在船' and tab.busi_type='export' THEN(
     		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.avesselname
            ELSE bsjm.avesselname END 
       )
       ELSE null END ) currentShipName, //2、响应字段“所在船名”的判断条件有点复杂。

	(CASE (CASE op.opttype WHEN '卸船' THEN '在场' WHEN '入闸' THEN '在场' WHEN '出闸' THEN '在场' ELSE '在船' END )
       WHEN '在船' and tab.busi_type='import' THEN (
       		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.imo
            ELSE ss.imo END 
       )
       WHEN '在船' and tab.busi_type='export' THEN(
     		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.imo
            ELSE bsjm.imo END 
       )
       ELSE null END ) imo, //3、“imo” 也如此。

	(CASE (CASE op.opttype WHEN '卸船' THEN '在场' WHEN '入闸' THEN '在场' WHEN '出闸' THEN '在场' ELSE '在船' END )
       WHEN '在船' and tab.busi_type='import' THEN (
       		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.owner
            ELSE ss.owner END 
       )
       WHEN '在船' and tab.busi_type='export' THEN(
     		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.owner
            ELSE bsjm.owner END 
       )
       ELSE null END ) owner, //4、“船公司”也如此。

	(CASE (CASE op.opttype WHEN '卸船' THEN '在场' WHEN '入闸' THEN '在场' WHEN '出闸' THEN '在场' ELSE '在船' END )
       WHEN '在船' and tab.busi_type='import' THEN (
       		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.outboundvoy
            ELSE ss.inboundvoy END 
       )
       WHEN '在船' and tab.busi_type='export' THEN(
     		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.outboundvoy
            ELSE bsjm.inboundvoy END 
       )
       ELSE null END ) boundvoy, //5、“航次”也如此。

	(CASE (CASE op.opttype WHEN '卸船' THEN '在场' WHEN '入闸' THEN '在场' WHEN '出闸' THEN '在场' ELSE '在船' END )
       WHEN '在船' and tab.busi_type='import' THEN (
       		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.avesselname
            ELSE ss.avesselname END 
       )
       WHEN '在船' and tab.busi_type='export' THEN(
     		CASE WHEN op.opttype='装船' and tab.outvesselname=op.avesselname and tab.outboundvoy=op.boundvoy THEN bs.avesselname
            ELSE bsjm.avesselname END 
       )
       ELSE op.terminalcode END ) currentShipNameOrPort, //6、“所在船/码头”也如此。

	null shipInfo,
	brso.terminalcode,
	
	(CASE 
	 WHEN tab.busi_type='import' THEN(
        CASE WHEN op.opttype='装船' and op.creator_org_id='SCCT' THEN bs.eta_time
          WHEN (op.opttype='卸船' or op.opttype='入闸' or op.opttype='出闸') and op.creator_org_id='JM' THEN bsjm.eta_time 
          ELSE ss.eta_time END
     )
     WHEN tab.busi_type='export' THEN(
     	CASE WHEN op.opttype='装船' and op.creator_org_id='SCCT' THEN ss.eta_time
     		WHEN op.opttype='卸船' and op.creator_org_id='SCCT' THEN bs.eta_time
     		ELSE bsjm.eta_time END
     )
     ELSE null END) eta_time, //7、“操作时间”也如此

	brso.atb_time,
	brso.atd_time
</sql>
```





##### Entity入参实体类：

```java
/**
  * 集装箱综合信息查询入参
  * @author ex-hezhenghao001
  */
@Data
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = false)
@ApiModel(description = "集装箱综合信息查询入参")
public class ContInfoQueryReq{
    
    /**
      * 集装箱号
      */
    @ApiModelProperty("集装箱号")
    private String containerno;
    
    ... String bl, //订舱单号
    ... String do, //提运单号
    ... String[] containerownerArr; //箱主（多选枚举）
    ... String[] containertypeArr; //箱型(多选枚举)
    ... BigDecimal containersize; //尺寸
    ... String[] inaimArr; //中转类型(多选枚举)
    ... String[] inownerArr; //一程船公司（多选枚举）
    ... String invesselname; //一程船名
    ... String inboundvoy; //一程航次
    ... String[] polArr; //装货港（多选枚举）
    ... String[] tpodArr; //中转港（多选枚举）
    ... String[] outownerArr; //二程船公司（多选枚举）
    ... String outvesselname; //二程船名
    ... String outboundvoy; //二程航次
    ... String[] podArr; //卸货港（多选枚举）
    ... String[] finalportArr; //目的港（多选枚举）
    ... String currentStatus; //当前状态
    ... String[] currentPortArr; //所在港口（多选枚举）
    ... String currentShipName; //所在船名
    ... String currentBoundvoy; //所在船航次
    ... String isdamage; //箱况
    ... String hotbox; //HOTBOX
    ... String isimdg; //是否是危险品
    ... String isreef; //是否是冷冻柜
    ... String isovertop; //是否超限
    ... String emptyfull; //空/重
    ... String owner; //船公司
    ... String reportFlag; //是否报到（Y-是，N-否）
    ... String[] terminalcodeArr; //作业码头（多选枚举）
    ... BigDecimal terminalDistanceStart; //距作业码头距离（开始值）
    ... BigDecimal terminalDistanceEnd; //距作业码头距离（结束值）
    ... LocalDateTime etaTimeStart; //ETA（开始时间）
    ... LocalDateTime etaTimeEnd; //ETA（结束时间）
    ... LocalDateTime atbTimeStart; //ATB（开始时间）
    ... LocalDateTime atbTimeEnd; //ATB（结束时间）
}
```



![1596631117332](..\pingan\API-Development-ContInfo.assets\1596631117332.png)

##### where子句查询条件：

```java
<!--列表查询where条件-->
<sql id="pageQueryWhere">
	<if test="req.containerno != null and req.containerno != ''">
		and tab.containerno = #{req.containerno}
	</if>
	...= req.bl
	...= req.do
	<if 
        test="req.containerownerArr != null and req.containernownerArr.length > 0">
        	and tab.containerowner in
        	<foreach item="item" collection="req.containerownerArr"
        		separator="," open="(" close=")" index="">
        		#{item, jdbcType=VARCHAR}
			</foreach> 
	</if>  //1、如上图列表查询页面。多选枚举的入参字段用<foreach>循环标签遍历。
	...for req.containertypeArr
	...=   req.containersize
	...for req.inownerArr
	...=   req.invesselname
	...=   req.inboundvoy
	...for req.polArr
	...for req.tpodArr
	...for req.outownerArr
	...=   req.outvesselname
	...=   req.outboundvoy
	...for req.podArr
	...for req.finalportArr
	...=   req.currentStatus
	<if test="req.currentStatus == 'onBoard'.toString()">
		and op.opttype='装船'
     </if>
	<if test="req.currentStatus == 'exitGate'.toString()">
		and op.opttype='出闸'
     </if>
     <if test="req.currentStatus == 'onYard'.toString()">
		and （op.opttype='卸船' or op.opttype='入闸'）
     </if>  //2、对where子句条件用if判断。
     ...for req.currenetPortArr
     <if test="req.isdamage != null and req.isdamage !=''">
     	and ifnull(op.isdamage,tab.isdamage) =#{req.isdamage}
	 </if>
	 ...=   req.isimdg
	 ...=   req.isreef
	 ...=   req.isovertop
	 ...=   req.emptyfull
     <if test="req.reportFlag == 'Y'.toString()">
     	and bc.terminalcode is not null
	 </if>
     <if test="req.reportFlag == 'N'.toString()">
     	and bc.terminalcode is null
	 </if>
	 ...for req.terminalcodeArr
</sql>
```





### 下拉框接口：

#### Controller层：

```java
 @GetMapping(value = "getDropBoxData")
 @ApiOperation("获取集装箱综合信息分页查询下拉框数据")  //1、写好提交方式，匹配路径和swagger信息。
 @AuthPermissions
public ResultBase<ContInfoQueryDropBoxResps> getDropBoxData(){ //2、创建下拉框出参实体类。
    log.info("获取集装箱综合信息分页查询下拉框数据，入参：");
    ContInfoQueryDropBoxResps resp = service.getDropBoxData(); //3、调用方法接收下拉框数据。
    return ResultUtil.ok(resp); //4、封装并返回结果。
}
```



##### Entity层：

承接上面第2步。

```java
/**
  * 集装箱操作信息查询，查询条件下拉框数据出参，每个字段表示一个对应的下拉框数据
  * @author ex-hezhenghao001
  */
@Data
@Accessors(chain=true)
@EqualsAndHashCode(callSuper = false)
@Apimodel(description = "集装箱操作信息查询，查询条件下拉框数据出参，每个字段表示一个对应的下拉框数据")  
public class ContInfoQueryDropBoxResp { //1、写好注解、swagger注释、方法名。
    
    /**
      * 箱主
      */
    @ApiModelProperty("箱主")
    private List<DropDownBoxResp> containerownerArr;
    
    /**
      * 箱型
      */
    @ApiModelProperty("箱型")
    private List<DropDownBoxResp> containertypeArr;
    
    /**
      * 中转类型
      */
    @ApiModelProperty("中转类型")
    private List<DropDownBoxResp> containertypeArr;
    
    ......  //2、看需求页面有几个下拉框。就对应编写几个下拉框字段。字段类型都是列表结构，列表存储以前的 基础下拉框出参类DropDownBoxResp。
}
```



#### Service层：Intervice --> Impl

PortContInfoServiceImpl.java在 portquery -impl里。

```java
@Autowired
private PortParameterCfgService cfgService；

@Override
public ContInfoQueryDropBoxResp getDropBoxData() { //1、编写方法名，返回类型是下拉框出参类。
    ContInfoQueryDropBoxResp resp = new ContInfoQueryDropBoxResp(); //2、创建出参类对象。
    Map<String, List<PortParameterCfg>> cfgData = cfgService.queryAllDataFromCache();//3、注入参数配置表服务实现类，调用服务实现类里的方法，接收从redis缓存中取出的所有"参数配置下拉框"的值。
//箱主
resp.setContainerownerArr(getDropDataFromTable(ContInfoQueryEnum.CONTAINEROWNER.getValue(),
	ContInfoQueryEnum.CONTAINEROWNER.getName())); //4、写好对应下拉框注释。从枚举类获取"箱主"的value值和name值，再调用getDropDataFromTable（）方法，传入value和name值，从数据库表中获取"箱主"的下拉框数据。最后出参类对象调用set()方法保存数据。
//箱型
resp.setContainertypeArr(getDropDataFromTable(ContInfoQueryEnum.CONTAINERTYPE.getValue(),
	ContInfoQueryEnum.CONTAINERTYPE.getName())); //5、同上。
//中转类型
resp.setInaimArr(cfgService.getParamCfgByType(ParameterCfgType.INAIM, cfgData)); //6、调用getParamCfgByType()方法，传入枚举类里"中转类型"的所有属性，传入所有"参数配置下拉框"的值，从这所有参数值的map对象里获取"中转类型"的下拉框数据。最后出参类调用set方法保存。
    ......
}
```



##### Entity下拉框枚举类：

第6步里的枚举类。在 enums-common 枚举公共层下。

```java
/**
  * 参数配置，参数类型枚举
  * @author ex-hezhenghao001
  */
@Getter
public enum ParameterCfgType { //1、写好注释和方法名。
    BARGEFEETYPE( funcModule: "bargeShipment", paramType: "bargefeetype", desc: "驳船船期信息，靠泊费结算"),
    ULTYPE( funcModule: "bargeShipment", paramType: "ultype", desc: "驳船船期信息，装卸类型"),
    INAIM( funcModule: "bargeShipment", paramType: "inaim", desc: "驳船船期信息，中转类型"),
    ...... // 2、根据 "参数配置表" 里的三个字段"funcModule","paramType"，"desc"来填写对应的所属值。 
        
   private String funcModul; //参数所属的功能模块。
   private String paramType; //参数类型，区分不同的参数组。
   private String desc； //参数描述。
       
   ParameterCfgType(String funcModule， String paramType， String desc) {
   	   this.funcModule = funcModule;
       this.paramType = paramType;
   }
} 
```

> 方法对比总结：
>
> 之前的下拉框是value和name，再把这两个值作为字段列表用sql语句从对应的数据库“船期表”中查询下拉框数据。
> 现在是看需求页面需要什么下拉框数值，就添加相应下拉框数值到数据库的参数配置表“port_parameter_cfg”里。再用sql语句从表里把所有下拉框数值查出来，然后存入redis中。需要再取出来。



##### Common公共模块：

第3步里获取所有下拉框数值的方法。

因为这是可以共用的下拉框类， 所以在service-common 服务公共层下。PortParameterCfgService: 方便注入，所以写了个Intervice和Impl类。

```java
/**
  * 获取所有的参数配置表数据， 优先查询缓存中的数据
  *
  */
Map<String, List<PortParamterCfg>> queryAllDataFromCache(); //写好类型，写好方法名。

/**
  * 获取所有的参数配置表数据，直接查询表中数据
  * @return
  */ 
//List<PortParameterCfg> queryAllDataFromDB();

/**
  * 获取指定参数类型的下拉框数据，返回下拉框列表数据
  *	@param type,data
  */
//List<DropDownBoxResp> getParamCfgByType(ParameterCfgType type, 
//										Map<String, List<PortParameterCfg>> data);
```

PortParameterCfgServiceImpl:

```java
@Override
public Map<String, List<PortParamterCfg>> queryAllDataFromCache(){
 String cfgJson = (String) redisUtils.get(RedisDatakeyEnum.PARAM_CFG_DATA.getRedisKey()); //1、获取redis存储数据的键值名称。框架自带的redis缓存工具类调用get方法，放入redis存储数据的键值名称。取出缓存在redis中所有的下拉框数值。类型取出来应该是Map，强转，方便下面作判断。
    if(StringUtils.isEmpty(cfgJson)) { 
        return putParamDataToRedis(); //2、判断总值是否为空，为空则调用方法重新获取总值，存入redis再返回。
    } else {
        Map<String, List<PortParamterCfg>> data = JSON.parseObject(cfgJson,
                new TypeReference<Map<String, List<PortParamterCfg>>>(){
                 }.getType()); //3、在Fastjson中提供了一个用于处理泛型反序列化的类TypeReference,通过TypeReference能够解决类型问题
        return data; //4、返回下拉框总值。
    }
}

private static final String SPLIT_CHAR = ""#@#;

 /**
   * 将参数配置表中的数据放置到redis缓存中
   * @return
   */
private Map<String, List<PortParameterCfg>> putParamDataToRedis() {  //2.1、接上面第二步。写好方法名和返回类型。
    final Map<String, List<PortParameterCfg>> data = new HashMap<~>(); //2.2、创建map集合对象。用final修饰。当用final修饰一个变量时，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能更改；如果是引用类型的变量，则在对其初始化之后便不能再让其指向另一个对象。
    List<PortParameterCfg> dbList = queryAllDataFromDB(); //2.3、调用方法，用sql语句从参数配置表获取下拉框所有数据，用集合类型对象接收。
    dbList.forEach(cfg -> { //2.4、调用forEach（）和lamda方法遍历集合对象，cfg就是遍历的一行行数据。
       List<PortParameterCfg> cl = data.get(cfg.getFuncModule() + SPLIT_CHAR + cfg.getParamType());//2.5、Map集合对象调用get()方法，传入拼接对应下拉框功能和类型的key值，获取下拉框总值。List集合接收。
        if(cl == null){//2.6、判断从Map集合里取出的总值是否为空。肯定为空，map集合是新建的，啥也没有。
           cl = new ArrayList<~>();
           cl.add(cfg); //2.7、赋予变量cl新的集合。调用add方法保存遍历的一行下拉框数据。
           data.put(cfg.getFuncModule() + SPLIT_CHAR + cfg.getParamType(), cl); //2.8、Map集合调用put方法，以拼接对应下拉框功能和类型的key为键值，以存储了一行下拉框数据的列表对象为value值。它会一遍遍循环作这些操作，当结束时就存储好了一个下拉框种类的各个值。
        } else {
            cl.add(cfg); //2.9、这步没啥意义。
        }
    });
redisUtils.set(RedisDataKeyEnum.PARAM_CFG_DATA.getRedisKey(),JSON.toJSONString(data)); //2.10、缓存工具类调用set方法，以拼接Key为键值。redis存储对象的方式二：使用fastjson将对象转为json字符串后存储，所以把Map对象转成json字符串后为value值。以上即把下拉框总值存入redis缓存中。
return data; //2.11、返回Map集合对象。
} 

@Override
public List<PortParameterCfg> queryAllDataFromDB() { //2.3.1、承接上面2.3步，写好方法名和返回类型。并且在上上面的Intervice文件里写了个接口，变成接口和实现类。方便注入调用。
    retrun mapper.queryByType(funcModule:"", paramType:""); //2.3.2、调用方法，传入下拉框功能和类型都为空。在sql语句作判断的时候即可跳过这两个条件，直接查询整张表，即可得到参数配置表所有数据。返回结果。
}

@Override
public List<DropDownBoxResp> getParamCfgByType(ParameterCfgType type, 
                                 Map<String, List<PortParameterCfg>> data){ //6.1、承接PortContInfoServiceImpl.java文件里的第六步。写好方法名和返回类型，形参是枚举类里"中转类型"的所有属性和所有"参数配置下拉框"的总值。。并且也写成接口和实现类格式。
    List<PortParameterCfg> cfgList = data.get(type.getFuncModule() + SPLIT_CHAR + type.getParamType()); //6.2、Map集合对象调用get方法，传入拼接key值，获取对应下拉框的各个值。用list类型接收。
    if(cfgList == null) {  
        return new ArrayList(~); //6.3、判断list集合对象是否为空。为空则直接赋予一个空列表对象。
    } else {
        List<DropDownBoxResp> rs = new ArrayList<~>(); //6.4、创建list集合对象，存入对象为“基本下拉框”实体类对象。
        cfgList.forEach(cfg -> { //6.5、调用forEach（）和lamda方法遍历集合对象。
            if("1".equals(cfg.getshowFlag())) { //6.6、用show_flag 字段来判断是否要在下拉框中显示。
                rs.add(new DropDownBoxResp().setValue(cfg.getParamKey()).setName(cfg.getParamVal())); //6.7、创建“基本下拉框”实体类对象，调用set方法，保存从一行列表数据里取出的"参数键值"、"参数数值"。最后list集合对象再调用add方法保存这实体类对象。一遍遍循环执行这些操作，当结束时，列表集合对象就已存储好对应下拉框的各个数值。
            }
        });
        return rs; //6.8、返回列表集合对象给前端展示。
    }
}
```



##### Entity-redis存储键值名称枚举：

第1步的枚举类。

```java
/**
  * redis存储数据的键值名称枚举
  * @author ex-hezhenghao001
  */
@Getter
public enum RedisDataKeyEnum {
    PARAM_CFG_DATA(redisKey:"paramterCfgAllData", desc:"参数配置表的redis缓存键值名称")；
    
    private String redisKey;
    private String desc;
    
    RedisDataKeyEnum(String redisKey, String desc) {
        this.redisKey = redisKey;
        this.desc = desc;
    }
}
```



#### Mapper->Xml 层：

PortParameterCfgMapper.java ,  PortParameterCfg.xml  在mapper-common下。

```java
<!--表名-->
<sql id="table">
	port_parameter_cfg
</sql>

<sql id="where_left">
	status = '1'
</sql>

<select id="queryByType" resultMap="BaseResultMap">
	select
	<include refid="Base_Column_List" />
    from
    <include refid="table" />
    <where>
    	<include refid="where_left" />
    	<if test="funcModule != null and funcModule != ''">
    		and func_module = #{funcModule}
		</if>
		<if test="paramType != null and paramType != ''">
			and param_type = #{paramType}
		</if>
	</where>
	order by param_type,param_order
</select> //1、从参数配置表里获取所有值的sql语句。
```



![1596785271882](F:\Java-Route\pingan\API-Development-Import process（ContInfo）.assets\1596785271882.png)

### 详情接口：

#### Controller层：

```java
@PostMapping(value = "detail")
@ApiOperation("集装箱物流信息详情页")
@AuthPermissions("M0701B02") //1、写好提交方式、路径和swagger注释。
public ResultBase<ContInfoQueryDetailResp> detail(@RequestBody 
    								@Validated ContDetailReq req){ //2、新建出入参类，写好方法名。因为有多个入参，所以详情接口用Post提交，加这两个注解，并且入参用实体类。才不会出错。
    log.info("获取集装箱物流信息详情页，入参：req={}",JSON.toJSONString(req));
    ContInfoQueryDetailResp resp = contInfoService.detail(req); //3、调用方法，传入请求参数，接收结果。
    return ResultUtil.ok(resp); //4、封装结果。
}
```



#### Service层：

##### Intervice:

```java
/**
  * 集装箱综合信息详情页
  *	@param req
  * @return
  */
ContInfoQueryDetailResp detail(ContDetailReq req);
```



##### Impl:

```java
@Override
public ContInfoQueryDetailResp detail(ContDetailReq req){ //1、写好方法名，入参类型和返回类型。
    List<ContInfo> dto = this.mapper.selectOneByContDetail(req.getContainerno(),
                                            req.getBl(),req.getDO()); //2、调用方法，传入从入参对象中取出的集装箱号，订舱单号和提运单号。用list集合对象接收结果。防止报多结果异常，因为是详情页，只能有一列结果数据。
    ContInfoQueryDetailResp resp = new ContInfoQueryDetailResp(); //3、新建出参类对象。
    if(dto!=null){ //4、判断数据库实体集合对象是否为空，防止报空指针异常。
        List<DangerousGoodsInfoResp> dgiList = new ArrayList<~>(); //5、新建集合对象，存储类型"危险品信息"类对象。
        if(!StringUtils.isEmpty(dto.get(0).getDangerlevel()) || !StringUtils.isEmpty(dto.get(0).getImdgunno())){ //6、用工具类判断从一列结果数据中获取的"危险品等级","危险品un码"是否为空。
            //取出"危险品信息"数据
            DangerousGoodsInfoResp dg = new DangerousGoodsInfoResp; 
            dg.setDangerlevel(dto.get(0).getDangerlevel());
            dg.setImdgunno(dto.get(0).getImdgunno()); //7、新建"危险品信息"类对象。再调用set方法保存从一列结果数据中获取的"危险品等级","危险品un码"数值。
            dgiList.add(dg); //8、"危险品信息"类集合对象再保存"危险品信息"类对象。如上需求页面里的"危险品信息"列表就已拼装完毕！
        }
        resp = this.portContInfoQueryDetailMapping.entityToResp(dto.get(0)); //9、调用方法，数据库实体转出参实体。
        resp.setDangerousGoodsInfoResps(dgiList); //10、出参类对象调用set方法保存"危险品信息"类集合对象。
    } else { 
        resp.setDangerousGoodsInfoResps(new ArrayList<~>()); //11、如果数据库实体集合对象为空，也要保存一个空的"危险品信息"列表对象。防止报空指针异常。
    }
    return resp; //12、返回出参类结果对象。
}
```



#### Mapper层：

```java
/**
  * 集装箱综合信息详情页
  * @param containerno,BL,DO
  * @return ConInfo
  */
List<ContInfo> selectOneByContDetail(
	@Param("containerno") String containerno, @Param("BL") String BL, @Param("DO") String DO);
```



![1596791094864](F:\Java-Route\pingan\API-Development-Import process（ContInfo）.assets\1596791094864.png)



##### Xml层：

###### Response出参字段列表：

```java
<!--集装箱综合详情页结果列-->
<sql id="Cont_Detail_List">
	inf.containerno,inf.containertype,inf.maxweight,inf.containersize ......
    null typeofoperation,null businessnodes,null nameofgoods,null ticketinfo,
	null specialcaseinfo,null hotbox,  //1、 需求页面中无法确定的字段，在出参类中自己取名定义好字段。然后在sql语句中赋予空值。
	bs.eta_time oneeta,bs.atb_time oneatb,br.eta_time twoeta,br.atb_time twoatb //2、如上需求图，一程船、二程船的ETA，ATB这四个时间是需要关联大船表、驳船表得出的。如果直接在最上面的映射列表中写如下映射关系：
     <result column="eta_time" property="oneeta" />
     <result column="atb_time" property="oneatb" />......  
     //会发现info表里本来就存在有eta_time = etaTime，atb_time=atbTime 的映射关系。。如果我继续用同一个字段映射不同的别名，会成功进行映射赋值吗？
//  答案是：不会成功。所以要对最上面映射列表中的映射关系进行改写，如下：
    <!--进口流程-STEP1-大船订舱-集装箱业务信息 给大船船期表"eta_time""atb_time"字段取别名-->
      <result column="oneeta" property="oneeta" />
      <reslut column="oneatb" property="oneatb" />...... //直接用别名映射别名即可。注意写上注释说明。同时在基本实体类里也要加上这四个别名。
 </sql>
```

###### Select语句：

```java
<!--集装箱综合信息详情页-->
<select id="selectOneByContDetail" resultMap="BaseResultMap"> //1、写好注释、方法名和封装结果类型。
	select
	<include refid="Cont_Detail_List" />, 
(CASE cor.relstate WHEN 'R' THEN '放行' WHEN 'B' THEN '不放行' ELSE cor.relstate END)relstate,
(CASE cor.chkstate WHEN 'Y' THEN '是' WHEN 'N' THEN '否' ELSE cor.chkstate END)chkstate //2、写好出参字段列表，如上。
	from
		<include refid="table" />
	left join (
		select containerno,bl,do,relstate,chkstate from block_record_cont_release group by containerno,bl,do.relstate,chkstate) cor on cor.containerno = inf.containerno //3、用集装箱号左关联“集装箱码头放行信息结果表”。
	left join 
		(select 
			eta_time,atb_time,avesselname,inboundvoy,owner
          from
            	block_record_ship_shipment
          group by
        		berthplanno,avesselname,evesselname,owner,imo,inboundvoy,
   				invesselname,inbusinessvoy,outboundvoy,outvessellinecode,outbusinessvoy,
        		terminalcodes,inagent,outagent,memo,eta_time,
         		pob_time,etd_time,atb_time,atd_time
         ) bs //4、左关联"大船船期信息表"，大船表跟另一张业务表合并之后有很多重复数据，需要去重。去重条件应该是原来表里的字段。才不会重复。（再回来看看！）
     on 
      	inf.invesselname = bs.avesselname
      	and inf.inboundvoy = bs.inboundvoy
      	and ifnull(inf.inowner,'') = ifnull(bs.owner,'') //4.1、如上需求图，进口流程的一程船是大船。所以用"箱业务信息表"里的"一程船名"，"一程船航次"，"一程船公司"（要作为空判断，不然云测试环境会报错。）三个字段作关联。
   left join
        (select eta_time,atb_time,avesselname,outboundvoy,owner from block_record_barge_shipment
       	gruop by
       	berthplanno,cvesselname,avesselname,owner,agent,barge_tel,imo,inboundvoy,outboundvoy
       	invessellinecode,outvessellinecode,inbusinessvoy,outbusinessvoy,bargestartport,lastport,
        nextport,bargeendport,bargeworkseq,memo,eta_time,atb_time,bargefeetype,inmemo,outmemo,
         hotbox,lastupdatetime ) br
    on
      	inf.outvesselname = br.avesselname
      	and inf.outboundvoy = br.outboundvoy
      	and ifnull(inf.outowner,'') = ifnull(br.owner,'') //5、左关联"驳船船期表",去重。进口流程的二程船是驳船。所以用"箱业务信息表"里的"二程船名"，"二程船航次"，"二程船公司"三个字段作关联。（业务还不是很清楚，就看需求需要什么，要一程，还是二程，还是一程二程都要，就用什么连接给它得出值！）
    left join
    	block_record_cont_optin op  //6、左关联"箱操作信息表"，因为是进口，所以关联的是optin。
   	on 
   		(inf.containerno = op.containerno
   		and inf.bl = op.bl)
    	or
    	(inf.containerno = op.containerno
    	and inf.do = op.do) 		//7、用集装箱号和订舱单号或提运单号关联。因为集装箱号和订舱单号或提运单号就可以确定一条船。
    <where>
    	<if test="containerno !=null and containerno != ''">
    		and inf.containerno = #{containerno}
		</if>
		<if test="BL != null and BL != ''">
			and inf.bl = #{BL}
		</if>
		<if test="DO != null and DO != ''">
		 	and inf.do = #{DO}
		</if> 
	</where>  //8、前端传入三个入参条件。
		order by inf.lastupdatetime desc //9、用"最后修改时间"字段排序，方便service层中只取最新的数据。也防止报多结果异常。因为不确定它是否只有一条数据。
</select>
```

