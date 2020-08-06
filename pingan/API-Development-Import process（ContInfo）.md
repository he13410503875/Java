# 进口流程（包含集装箱综合信息）API-Development

根据需求页面编写  集装箱综合信息  “查询”  接口页面和  “下拉框”  选项接口和“详情”接口页面。

![1](C:\Users\admin\Desktop\pingan\API-Development-ContInfo.assets/1.jpg)

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



![1596627961000](C:\Users\admin\Desktop\pingan\API-Development-ContInfo.assets/1596627961000-1596628010537.png)

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



![1596631117332](C:\Users\admin\Desktop\pingan\API-Development-ContInfo.assets\1596631117332.png)

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
resp.setInaimArr(cfgService.getParamCfgByType(ParameterCfgType.INAIM, cfgData)); //6、调用getParamCfgByType()方法，传入枚举类里"中转类型"的属性，传入所有"参数配置下拉框"的值，从这所有参数值的map对象里获取"中转类型"的下拉框数据。最后出参类调用set方法保存。
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
```

PortParameterCfgServiceImpl:

```java
@Override
public Map<String, List<PortParamterCfg>> queryAllDataFromCache(){
 String cfgJson = (String) redisUtils.get(RedisDatakeyEnum.PARAM_CFG_DATA.getRedisKey()); //1、获取redis存储数据的键值名称。框架自带的redis缓存工具类调用get方法，放入redis存储数据的键值名称。取出缓存在redis中所有的下拉框数值。类型取出来应该是Map，强转，方便下面作判断。
    if(StringUtils.isEmpty(cfgJson)) { 
        return putParamDataToRedis(); //2、判断总值是否为空，为空则再重新获取，再存入redis中！
    } else {
        Map<String, List<PortParamterCfg>> data = JSON.parseObject(cfgJson,
                new TypeReference<Map<String, List<PortParamterCfg>>>(){
                 }.getType());
        return data;
    }
}
```



##### Entity-redis存储键值名称枚举：

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



























































