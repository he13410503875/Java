# 进口流程 API-Development 02

![1596799020908](F:\Java-Route\pingan\02API-Development-Import process.assets\1596799020908.png)

### 进口流程步骤一：一程船期确认，大船船期信息-接口：

#### Controller-Service层：

```java
@Override
public ShipShipmentDetailResp shipShipmentInfo(ContImportQueryReq req) { //1、写好方法名、入参类型和出参类型。这个入参实体类里有好几个字段，我们只需要那三个，其它入参字段不作处理也不会报错。前端应该也是只传入了三个字段数值。
    BigShipment shipInfo = bigShipmentMapper.queryShipShipmentInfo(req); //2、调用方法，传入入参。获取"大船船期表"数据，用数据库基本实体类对象接收。
    ShipShipmentDetailResp resp = new ShipShipmentDetailResp(); //3、新建出参类。
    if(shipInfo!=null) { //4、判断大船船期数据对象是否为空。防止空指针异常。
        resp = shipShipmentDtMapping.entityToResp(shipInfo); //5、调用方法，数据库实体转出参实体。
        List<OwnerInfo> ownerList = portBigShipmentOwnerInfoMapper. 
            				selectDetailByOwner(shipInfo.getBigshipId()); //6、调用另一个mapper层的方法，传入从大船船期数据对象中获取的主键Id。又从"大船船期表"中获取"箱主"信息，用集合对象接收。
        resp.setOwnerinfo(ownerInfoMapping.entityToResp(ownerList)); //6.1、出参类调用set保存集合对象。
    } else {
        resp.setOwnerinfo(new ArrayList<~>()); //7、如果大船船期数据对象为空，也要赋予"箱主信息"字段新的列表对象。
    }
    return resp; //8、返回出参结果对象。
}
```



#### Mapper-Xml层：

```java
<!--进口流程步骤一：查询大船船期信息-->
<select id="queryShipShipmentInfo" resultMap="BaseResultMap"> //1、写好注释和方法名、封装类型。
	select
		<include refid="query_Column_List" /> //2、对照需求页面，写好出参字段列表。	
    from
    	<include refid="table" /> tab, 
		(select inowner,invesselname,inboundvoy
		  from block_record_cont_info 
		  where
		  containerno =#{req.containerno}
           and creator_org_id='SCCT'
           and do=#{req.DO}
           ) ci  //3、用"集装箱号"，"上链机构"，"提运单号"字段确定"箱业务信息表"的结果域。其中"集装箱号"、"提运单号"字段从入参实体类里获取。另类确定表的方法。
     <where>
     	   ifnull(tab.owner,'')=ifnull(ci.inowner,'')
            and tab.avesselname = ci.invesselname
            and tab.inboundvoy = ci.inboundvoy
            and tab.creator_org_id='SCCT'  //4、"大船船期表"和"箱业务信息表"关联。"船公司""一程船名""一程船航次""上链机构"字段作关联条件。 都要加个"上链机构"字段，来确认数据源是来自招商还是江门。
     </where>
     	group by <include refid="group_Column_List" /> //5、用出参字段列表对大船船期数据进行去重。
 </select>
    
```



### 进口流程步骤一：一程船期确认，集装箱业务信息。步骤三：跨关区调拨，集装箱业务信息--接口：（略）



![1596798973806](F:\Java-Route\pingan\02API-Development-Import process.assets\1596798973806.png)

### 进口流程步骤二：大船作业，船作业信息查询--接口：

##### Controller-Service层：

```java
@Override
public ShipOptionDetailResp queryShipOptionInfo(ContImportQueryReq req) { //1、写好方法名、入参出参类型。参照上面的需求页面，需要根据港口切换不同的数据信息。所以入参需要多个 terminalcode码头字段。
    BigShipment shipInfo = bigShipmentMapper.queryShipShipmentInfo(req); //2、调用大船船期表mapper层下的一个方法，传入三个参数。得到"大船船期表"和"箱业务信息表"关联后得出的数据结果。用大船船期表实体类对象接收。这一步是为了先确定是哪一条大船。
    ShipOptionDetailResp resp = new ShipOptionDetailResp(); //3、新建出参类对象。  
    if(shipInfo != null) { //4、判断大船船期数据对象是否为空。
        List<ShipTaskment> list = shipTaskMapper.queryShipOptionInfo(
        req,shipInfo.getAvesselname(),shipInfo.getInboundvoy(),shipInfo.getOutboundvoy());//5、调用方法，传入入参实体类，传入从大船船期数据对象处获得的"船名""进口航次""出口航次"。（船名+航次 就能确定一条船?）从"集装箱操作信息表里"获取结果数据，用实体类集合对象接收。
        if(CollectionUtils.isNotEmpty(list)) { //6、判断集装箱操作数据集合对象是否为空。注意，这里不能直接判断！=null。要用集合工具类的方法去判断这个集合对象。因为如果里面存储的对象为空，会报空指针异常。用这个工具类的方法，就能同时判断它们两个是否为空。
            ShipTaskment dto = list.get(0);
            resp = shipoptionDetailMapping.entityToResp(dto); //7、对第一条数据进行数据库实体转出参实体。
            resp.setImo(shipInfo.getImo());
            resp.setOwner(shipInfo.getOwner());
        }
    }
    resp.setSecondaryInfo(new ArrayList(~)); 
    return resp; //8、调用set方法存储靠次信息空值。最后返回出参结果对象。
}
```



##### Mapper-Xml层：（略）



### 进口流程步骤二：大船作业，集装箱操作信息查询--接口：（跟步骤四-驳船集装箱操作信息 作对比。）

#### Mapper-Xml：

```java
<!-- 进口流程步骤二：大船作业，集装箱操作信息查询-->
<select id="contOptinInfo" resultMap="BaseResultMap">
	select
		<include refid="Cont_OptinInfo_List" />
    from
    	block_record_cont_optin tab ,
    	left join block_record_cont_info inf
    	on (tab.conainerno=inf.containerno or tab.do = inf.do
           and inf.creator_org_id='SCCT'
           and (tab.avesselname=inf.invesselname or tab.avesselname=inf.outvesselname))//1、用 "optin 箱操作信息进口表" 跟"箱业务信息表"关联。用"集装箱号","提运单号","船名"字段作关联条件。"集装箱号","提运单号"这两个字段就能确定一条船，怎么突然加个"船名"?不知道。
//在服务层已经是"驳船表"跟"箱业务信息表"关联查询确定好一条船了。怎么数据层还用"操作表"跟"信息表"再关联一次？  答：应该只是需要一些"箱业务表"的字段。所以才关联起来的。。
    <where>
    	tab.creator_org_id='SCCT'
    	and tab.opttype='卸船'
    	and tab.containerno = #{containerno}
		and tab.do = #{DO}
		and tab.avesselname = #{avesselname}
		and tab.boundvoy = #{boundvoy} //2、"操作表"的where子句查询条件。大船的操作类型是卸船。
	</where>
	order by tab.opttime desc //3、取最新的"操作时间"。
</select>

<!-- 进口流程步骤四：SCCT驳船作业，集装箱操作信息-->
<select id="contOptinInfoByBarge" resultMap="BaseResultMap">
	select
		...
    from
    	block_record_cont_optout tab //4、驳船作业的集装箱操作信息用"optout箱操作信息出口表"。
    	left join block_record_cont_info inf
    	on (tab.conainerno=inf.containerno or tab.do = inf.do
           and inf.creator_org_id='SCCT'
           and (tab.avesselname=inf.invesselname or tab.avesselname=inf.outvesselname))//5、"箱业务信息表"不变，因为数据源是招商港口，是相对招商港口来说的驳船作业。需求要什么，我们就连什么。
        <where>
        	..
        	and tab.opttype = '装船' //6、"操作表"的where子句查询条件。驳船的操作类型是装船。
        	...
        </where>
      	order by tab.opttime desc
</select>

<!-- 进口流程步骤六：PRD驳船作业，集装箱操作信息-->
<select id="contOptinInfoPRD" resultMap="BaseResultMap">
	select
		...
    from
    	block_record_cont_optin tab  //7、对江门港口来说，驳船是进口。所以用"optin箱操作进口表"。
    	left join block_record_cont_info inf
    on  (tab.containerno=inf.containerno and tab.do=inf.do
        and inf.creator_org_id='SCCT' //8、"箱业务信息表"的数据源还是招商的。
        and tab.avesselname=inf.outvesselname) //9、对招商港口来说，驳船是出口。所以用二程船名"outvesselname"作两表关联。
    <where>
    	tab.creator_org_id="JM"
        and tab.opttype='卸船' //10、数据源是江门。驳船操作类型是‘卸船’。
        and tab.containerno=#{containerno}
	    and tab.do=#{do}
	</where>
	order by tab.opttime desc
</select>
	
```



### 进口流程步骤三：跨关区调拨，驳船船期信息--接口：

![3](F:\Java-Route\pingan\02API-Development-Import process.assets/3.jpg)

![2](F:\Java-Route\pingan\02API-Development-Import process.assets/2.png)



#### Controller-Service层：（驳船表跟箱业务信息表，跟船作业表关联）

```java
@Override
public BargeShipmentDetailResp queryBargeShipmentDetailInfo(ContImportQueryReq req) { //1、写好方法名，出参入参。
    List<BargeShipment> dto = bargeShipmentMapper.queryBargeShipmentByContNo(req);//2、调用方法，确定是哪一条驳船。
    BargeShipmentDetailResp resp = new BargeShipmentDetailResp();
    if(CollectionUtils.isNotEmpty(dto)) {
        resp = bargeShipmentMapping.entityToResp(dto.get(0));
        optTerminalInfo(resp, dto.get(0));//3、调用方法，拼接上图需求页面中的 "作业码头信息、码头作业详情信息和反馈信息"。
        return resp; //4、返回驳船结果数据。
    }
    return resp;
}

/**
  * 作业码头信息、码头作业详情信息和反馈信息
  * @param resp
  */
private void optTerminalInfo(BargeShipmentDetailResp resp, BargeShipment dto) {//3.1、承接上面第3步，私密修饰符，无返回值，写好注释、方法名和入参。
    initOptTerminalInfo(resp);//3.2、初始化作业码头信息、码头作业详情信息和反馈信息等数据，防止前端页面空指针报错。
    if(dto==null) {
        return;
    }
    List<ShipTaskment> taskList = shipTaskMapper.queryShiptaskInfo(dto.getAvesselname(),
                                  dto.getInboundvoy(), dto.getOutboundvoy());//3.3、调用方法，传入参数，从船作业表中获取数据。
    
    if(CollectionUtils.isEmpty(taskList)) {//3.4、判断对象是否为空，为空则是下面的原因。
        // 还没有到港作业或者已经完成所有码头（港区作业顺序中罗列的所有码头）作业离港了
        return;
    }
    shipTaskment task = taskList.get(0);// 3.5、详情页面中的作业码头信息表格，只显示驳船正在某一个码头作业中的数据。所以取其一。
    if(task.getAtdTime() != null) {
    	task = taskList.get(taskList.size() - 1);//3.6、如果离港时间不为空，取离港时间最近的一个。
    }
    generateOptTerminalInfoData(resp, dto, task);// 3.7、拼接作业码头信息（表格数据）
    generateDockDetailFeedback（resp, dto, task);// 3.8、拼接作业详情信息和码头-反馈信息的数据
}

/**
  * 初始化作业码头信息、码头作业详情信息和反馈信息等数据，防止前端页面空指针报错
  */ 
private void initOptTerminalInfo(BargeShipmentDetailResp resp) { //承接上面3.2步，私密方法，无返回值，写好方法名和入参。
    resp.setOptTerminalInfoList(new ArrayList<~>());//3.2.1、给"作业码头信息"字段赋予空值。
    DockDetailFeedbackResp dfResp = new DockDetailFeedbackResp();//3.2.2、码头作业详情信息和反馈信息出参实体类新建对象。
    
    BargeDetailInfoResp dResp = new BargeDetailInfoResp();//3.2.3、码头作业详情信息实体类新建对象。
    dResp.setBoxHandleStatistics(new ArrayList<~>());
    dResp.setBoxHandleTotalResp(new ArrayList<~>());
    dfResp.setBargeDetailInfo(dResp);//3.2.4、给"箱装卸数量统计，包括F20,F40,F45等各个列"、"箱装卸数量总计，包括F20,F40,F45等各个列，只有一行数据"字段赋予空值。存储。
    
    DockFeedbackInfoResp fResp = new DockFeedbackInfoResp();
    dfResp.setDockFeedbackInfo(fResp);//3.2.5、反馈信息实体类新建对象。存储。
    
    resp.setDockDetailFeedback(dfResp);
}

/**
  * 驳船船期信息详情页面，作业码头信息（表格数据）
  * @param resp,dto,task
  */
private void generateOptTerminalinfoData(BargeShipmentDetailResp resp, BargeShipment dto,ShipTaskment task) {//3.7.1、承接上面3.7步。私密，无返回，写好注释、方法名和入参。
    List<OptTerminalIntoResp> list = new ArrayList<~>();//3.7.2、创建列表对象。
    OptTerminalInfoResp opt = new OptTerminalInfoResp();//3.7.3、作业码头信息实体类新建对象。
    BeanUtils.copyProperties(dto, opt);//3.7.4、Bean拷贝工具类，被复制对象的所有变量都含有与原来的对象相同的值。
    //所以驳船数据对象dto里的"作业码头信息"字段数值，已经复制给opt里的"作业码头信息"字段。这也说明这个工具类可以多字段拷贝少字段！
    opt.setTerminalcode(task.getTerminalcode());
    opt.setAtbTime(task.getAtbTime());
    opt.setAtdTime(task.getAtdTime());//3.7.5、从船作业数据对象中取出"港口"、"靠泊时间"、"离港时间"字段数值。分别存储。
    list.add(opt);
    resp.setOptTerminalInfoList(list);//3.7.6、列表对象存储作业码头信息实体类对象，出参对象再存储。拼接一项完成。
}

/**
  * 驳船船期信息详情页面，生成码头-作业详情信息和码头-反馈信息的数据
  * @param resp,dto,task
  */ 
private void generateDockDetailFeedback(BargeShipmentDetailResp resp,BargeShipment dto,ShipTaskment task) { //3.8.1、承接上面第3.8步。私密，无返回，写好注释、方法名和入参。
    DockDetailFeedbackResp detailAndFeedBack = new DockDetailFeedbackResp();//3.8.2、码头作业详情信息和反馈信息实体类新建对象。
    BargeDetailInfoResp detail = new BargeDetailInfoResp();//3.8.3、码头-作业详情信息实体类新建对象。
    generateDetailDate(detail,dto,task.getTerminalcode());
    detialAndFeedBack.setBargeDetailInfo(detail);//3.8.4、调用方法，拼接"码头-作业详情信息",存储。
    
    DockFeedbackInfoResp back = new DockFeedbackinfoResp();//3.8.5、码头-反馈信息实体类新建对象。
    generateBackDate(back,dto,task.getterminalcode());
    detailAndFeedBack.setDockFeedbackInfo(bock);//3.8.6、调用方法，拼接"码头-反馈信息",存储。
    
    resp.getDockDetailFeedback(detailAndFeedBack);//3.8.7、出参类对象存储码头作业详情信息和反馈信息实体类对象。拼接完成。
}
```

承接上面第3.8.4、3.8.6步。

```java
/**
  * 驳船船期信息详情页面，生成码头-作业详情信息
  * @param detail,dto,terminalcode
  */ 
private void generateDetailDate(BargeDetailInfoResp detail,BargeShipment dto, String terminalcode) { //1、私密，无返回，写好注释、方法名和入参。
    List<BargeShipment> detailList =
        bargeShipmentMapper.queryBargeDetailInfo(dto.getBerthplanno(),terminalcode);//2、调用方法，从"驳船船期表"里获取"箱装卸数量统计，包括F20,F40,F45等各个列"数据。
    List<BargeShipment> totalList = 
        bargeShipmentMapper.queryBargeDetailCount(dto.getBerthplanno(),terminalcode);//3、调用方法，从"驳船船期表"里获取"箱装卸数量统计，包括F20,F40,F45等各个列"的合计数据。
    if(!CollectionUtils.isEmpty(detailList) && !CollectionUtils.isEmpty(totalList)) {
        BargeShipment ship = detailList.get(0);//4、"驳船列表对象detailList"取一行值变为"驳船对象ship"。
        BeanUtils.copyProperties(ship,detail);//5、调用Bean工具类，把"驳船对象ship"字段的值拷贝给"码头-作业详情信息实体类对象detail"。
        //看如上需求页面，"码头-作业详情信息实体类对象detail"包括列表上的字段和一个列表字段。那拷贝的时候已经列表上字段拷贝好了。那会不会把列表里的字段都给拷贝了呢？答案是不会的，所以我们要做下面的步骤。
        List<BoxHandleStatisticsResp> statis = new ArrayList<~>();//6、新建"集装箱装卸数据列表"对象。
        for(int i=0;i<detailList.size();i++) { //7、用"驳船列表对象detailList"的长度作for循环。
            BoxHandleStaticsResp sta = new BoxHandleStatisticsResp();//8、新建"集装箱装卸数据实体类"对象。
            BeanUtils.copyProperties(detailList.get(i), sta);///9、取"驳船列表对象detailList"的每一行数据拷贝给"集装箱装卸数据实体类"对象。
            statis.add(sta);//10、"集装箱装卸数据列表"对象调用add()方法存储"集装箱装卸数据实体类"对象。循环完毕时，集装箱装卸数据已存入"集装箱装卸数据列表"对象中。
        }
        detail.setBoxHandleStatistics(statis);//11、"码头-作业详情信息实体类对象detail"再存储"集装箱装卸数据列表"对象。
        
        //合计
        List<BoxHandleTotalResp> totalResp = new ArrayList<~>();//12、新建"集装箱装卸数量总计列表"对象。
        for(int i=0;i<totalList.size();i++) { //13、用"驳船列表对象totalList"的长度作for循环。
            BoxHandleTotalResp total = new BoxHandleTotalResp();//14、新建"集装箱装卸数量总计"实体类对象。
            BeanUtils.copyProperties(totalList.get(i), total);//15、取"驳船列表对象totalList"的每一行数据拷贝给"集装箱装卸数量总计"实体类对象。
            totalResp.add(total); //16、"集装箱装卸数量总计列表"对象调用add()方法保存"集装箱装卸数量总计"实体类对象。循环完毕时，集装箱装卸数据总计已存入"集装箱装卸数量总计列表"对象中。
        }
        detail.setBoxHandleTotalResp(totalResp);//17、"码头-作业详情信息实体类对象detail"再存储"集装箱装卸数据总计列表"对象。"码头-作业详情合计信息"就拼接好了。
    }
}


/**
  * 驳船船期信息详情页面，生成码头-反馈信息
  * @param back,dto,terminalcode
  */
private void generateBackData(DockFeedbackInfoResp back,BargeShipment dto,String terminalcode) {//1、私密，无返回，写好注释、方法名和入参。
    List<BargeShipment> backList =
        bargeShipmentMapper.queryBargeBackInfo(dto.getBerthplanno(),terminalcode);//2、调用方法，从"驳船船期表"里获取数据。
    if(CollectionUtils.isNotEmpty(backList)){
        BargeShipment ship = backlist.get(0);//2、从"驳船船期表"数据列表对象里取一行数据，变为"驳船对象"。
        BeanUtils.copyProperties(ship,back);//3、调用Bean工具类，把"驳船对象"的值拷贝到"码头-反馈信息"实体对象上。至此，数据都拼装完成！
    }
}
```



#### Mapper-Xml：

 承接上面第2步：

```java
<!-- 进口流程步骤三，跨关区调拨，驳船船期信息 -->
<select id="queryBargeShipmentBycontNo" resultMap="BaseResultMap">
	select
		<include refid="query_Column_List" />,
		group_concat(containerowner order by containerowner) containerowner
	from
		<include refid="table" />,
	（select outowner,outvesselname,outboundvoy
	   from block_record_cont_info
	   	where
	   	containerno =#{req.containerno}
		and creator_org_id='SCCT'
         and do=#{req.DO}
		) ci  //1、用"集装箱号"，"上链机构"，"提运单号"字段确定"箱业务信息表"的结果域。其中"集装箱号"、"提运单号"字段从入参实体类里获取。
	<where>
		ifnull(tab.owner,'')=ifnull(ci.outowner,'')
        and tab.avesselname=ci.outvesselname
        and tab.outboundvoy=ci.outboundvoy
        and tab.creator_org_id='SCCT' //2、"驳船船期表"和"箱业务信息表"关联。"船公司""二程船名""二程船航次""上链机构"字段作关联条件。
    </where>
    group by <include refid="groupby_Column_List" /> order by tab.lastupdatetime
</select>
```



承接上面3.3步：

```java
<!-- 查询指定驳船船期编号的船作业信息，并且离港时间为空的数据，一般只有一条数据-->
	select
	<include refid="query_busi_column_list" />
    from
    <include refid="table" />
    <where>
    	<if test="avesselname != null and avesselname != ''">
    		and avesselname = #{avesselname}
		</if>
		<if test="inboundvoy != null and inboundvoy != ''">
			and inboundvoy = #{inboundvoy}
		</if>
		<if test="outboundvoy != null and outboundvoy != ''">
			and outboundvoy = #{outboundvoy}
		</if>  //1、用"船名"、"船航次"字段作查询条件得出船作业数据。
		and atb_time is not null //2、"靠泊时间"不能为空，靠泊了才能作业。为空则是还没靠泊到岸。
     </where>
     order by atd_time asc //3、按"离港时间"升序。
 </select>
```

##### 列表Sql需求：

![1597056510284](F:\Java-Route\pingan\02API-Development-Import process.assets\1597056510284.png)

承接上面第3.8.4里的第3、4步：  

如上图，着重讲解这种列表Sql怎么写。

```java
<!-- 查询驳船作业详情，只取当前正在作业的码头数据-->
<select id="queryBargeDetailInfo" resultMap="BaseResultMap">
	SELECT
		bargeulplanid,terminalcode,berthplanno,ultype,inaim,businesscode,containerowner,
		(CASE WHEN ultype = 'L' THEN f20 ELSE null END) f20,
		(CASE WHEN ultype = 'L' THEN f40 ELSE null END) f40,
		(CASE WHEN ultype = 'L' THEN f45 ELSE null END) f45,
		(CASE WHEN ultype = 'L' THEN fother ELSE null END) fother,
		(CASE WHEN ultype = 'L' THEN e20 ELSE null END) e20,
		(CASE WHEN ultype = 'L' THEN e40 ELSE null END) e40,
		(CASE WHEN ultype = 'L' THEN e45 ELSE null END) e45,
		(CASE WHEN ultype = 'L' THEN eother ELSE null END) eother,
		iscontainerownerorder,
		isterminalorder,
		(CASE WHEN ultype = 'U' THEN f20 ELSE null END) f20B,
		(CASE WHEN ultype = 'U' THEN f40 ELSE null END) f40B,
		(CASE WHEN ultype = 'U' THEN f45 ELSE null END) f45B,
		(CASE WHEN ultype = 'U' THEN fother ELSE null END) fotherB,
		(CASE WHEN ultype = 'U' THEN e20 ELSE null END) e20B,
		(CASE WHEN ultype = 'U' THEN e40 ELSE null END) e40B,
		(CASE WHEN ultype = 'U' THEN e45 ELSE null END) e45B,
		(CASE WHEN ultype = 'U' THEN eother ELSE null END) eotherB, //1、数据库中只有八个字段。如上需求图，根据"ultype"操作字段，来判断装箱/卸箱。同一域下，箱量都是一样字段的值，取不同的字段别名。
	FROM
		block_record_barge_shipment
	where berthplanno = #{berthplanno}
	and terminalcode = #{terminalcode}
</select>

<!--查询驳船作业详情，统计数据，只取当前正在作业的码头数据-->
<select id="queryBargeDetailCount" resultMap="BaseResultMap">
	SELECT
		sum(f20) f20, sum(f40) f40, sum(f45) f45, sum(fother) fother,
		sum(e20) e20, sum(e40) e40, sum(e45) e45, sum(eother) eother
	FROM
		block_record_barge_shipment
	where berthplanno = #{berthplanno}
	adn terminalcode = #{terminalcode}
</select>
```



### 进口流程步骤四：SCCT驳船作业，驳船船作业信息查询-接口：（跟步骤二类似，略）



### 进口流程步骤四：SCCT驳船作业，驳船船集装箱操作信息查询-接口：（跟步骤二对比，如上。）



### 进口流程步骤四：SCCT驳船作业，驳船报道-接口：（跟步骤五-驳船报道对比。）

![1597134757006](F:\Java-Route\pingan\02API-Development-Import process.assets\1597134757006.png)

#### Mapper-Xml层：

```java
<!-- 进口流程步骤四：SCCT驳船作业，驳船报道信息-->
<select id="bargeCfmetaInfo" resultMap="BaseResultMap">
	select
		...
    from
    	(select
    		...
        from	
        	<include refid="table" /> cf //1、"驳船报道表"
        join
        	(select 
            	...
             from
             	block_record_barge_shipment 
             where
             	creator_org_id='SCCT' group by ... ) bs //2、查驳船报道数据，要"驳船报道表"跟"驳船船期表"先关联起来。
            on
            	cf.avesselname=bs.avesselname
            	and cf.outboundvoy = bs.outboundvoy
            	and cf.creator_org_id='SCCT') //3、用"船名","出口航次"，"上链机构"作关联条件。
        	where
        		cf.terminalcode in ('SCT','CCT','MCT') ) cb //4、需求要求加的港口条件。 
        left join
        	block_record_cont_info inf 
        on
        	inf.outvesselname=cb.avesselname
        	and inf.outboundvoy=cb.outboundvoy
        	and inf.creator_org_id='SCCT' //5、左关联"箱业务信息表"，用"船名"，"航次"，"上链机构"作关联。
    <where>
    	...
    	#{containerno},#{bl},#{DO}
    </where>
    	order by cb.lastupdatetime desc
</select>    	


<!-- 步骤五：在途运输监管，驳船报道信息-->
<select id="bargeCfmetaInfoPRD" resultMap="BaseResultMap">
	select
		...
     from
     	(select
     		...
         from
         	<include refid="table" /> cg
         join
         	(select 
         		...
             from block_record_barge_shipment where creator_org_id='JM' group by ...) bs//6、"驳船船期表"的"上链机构"要变为江门，因为步骤五开始数据源来自江门。
         on
         	cf.avesselname=bs.avesselname
         	and cf.inboundvoy=bs.inboundvoy
         	and cf.creator_org_id='JM' //7、对于江门港口，驳船是进口。所以用"进口航次inboundvoy"字段作两表关联。
         where
         	cf.terminalcode = 'CNWAI' ) cb //8、江门码头只有一个。
         left join
         	block_record_cont_info inf
         on
         	inf.outvesselname = cb.avesselname
         	and inf.outboundvoy = cb.inboundvoy //9、箱业务信息表的"出口航次"和驳船船期表的"进口航次"作关联。
         	and inf.creator_org_id='SCCT' //10、重点：我们"箱业务信息表"的数据源还是招商的！
        	and cb.creator_org_id='JM' //11、驳船报道表的数据源是江门的。因为船过去江门码头那里报道了，所以取那里的报道数据。
        <where>
        ......
```



### 进口流程步骤五：在途运输监管，驳船报道信息-接口：（跟步骤四作对比，如上。）



### 进口流程步骤六：PRD驳船作业，集装箱操作信息-接口：（跟步骤二、四作对比，如上。）



### 进口流程步骤七、八、九、十-接口：（略）



### 获取进口流程步骤颜色标记-接口：

如下需求图：获取了数据的,，如步骤1-6，就亮起。没获取数据的就变暗，如步骤7，步骤9。

分析：写个判断接口，每个步骤栏调用一次，调用10次。

![1597138129089](F:\Java-Route\pingan\02API-Development-Import process.assets\1597138129089.png)



#### Controller层：

```java
@PostMapping(value = "queryImportProcessStatus")
@ApiOperation("获取进口流程步骤颜色标记")
@AuthPermissions("M0701B02") //1、写好提交方式、路径名、swagger注释和权限。
public ResultBase<ImportProcessStatusResp> queryImportProcessStatus( 
    @RequestBody @Validated ContImportQueryReq req) {//2、出参类定义各个步骤的名字，入参类不变，写好方法名。
    log.info("获取进口流程步骤颜色标记，入参：{}"，JSON.toJSONString(req));
    ImportProcessStatusResp resp = service.queryImportProcessStatus(req);
    return ResultUtil.ok(resp);//3、调用方法，返回数据，封装结果。
}
```



#### Mapper-Service层：

```java
@Override
public ImportProcessStatusResp queryImportProcessStatus(ContImportQueryReq req) { //1、写好出参入参、方法名。
    ImportProcessStatusResp resp = new ImportProcessStatusResp; //2、新建"进口流程步骤状态显示出参"实体类对象。
    
    if("step1".equalsIgnoreCase(req.getStepName())) { //3、从入参类中取"步骤名称stepName"字段。从十个判断条件中判断是步骤几。这就要跟前端商量，步骤一到步骤十，传"step1-step10"字段给后台。
        //一程船期确认
        ShipShipmentDetailResp respOne2 = this.shpiShipmentInlfo(req);//4、假如是步骤一，则进入方法并调用步骤一的"大船船期信息"整个方法，接收结果数据。
        PortContOperInfoResp respOne3 = this.contOperInfo(req);//5、调用步骤一的"集装箱业务信息"整个方法，接收结果数据。
        if((respOne2 != null && StringUtils.isNotEmpty(respOne2.getAvesselname()))
           || (respOne3 != null && StringUtils.isNotEmpty(respOne3.getContainerno()))){//6、判断"大船船期信息"结果对象是否为空和"大船船期信息"结果对象里的船名是否为空。或者，"集装箱业务信息"结果对象是否为空和"集装箱业务信息"结果对象里的集装箱号是否为空。
            resp.setShippingDate(1);//7、上面其中一个成立，则出参类对象存储“步骤一”字段为1.表示获取到了数据。点亮状态栏。
        }
    } else if ("step2".equalsIgnoreCase(req.getStepName())) { 
        //大船作业
        ShipOptionDetailResp respTwo1 = this.queryShipOptionInfo(req);//船作业信息
        ContOptinDetailResp respTwo2 = this.contOptinInfo(req);//集装箱操作信息
        if((respTwo1))
    } else if ("step3".equalsIgnoreCase(req.getStepName())) {
    	......
    } ......
    return resp;//8、如果是步骤一，则往下就没满足的条件了。因为一个步骤栏调用一次接口，只返回一个相应的步骤字段给后台，只进入其中的一个方法。最后直接返回状态码给前端。也要跟前端说好，字段的值0表示没有数据，1表示有数据。完成！
}
```





















































































