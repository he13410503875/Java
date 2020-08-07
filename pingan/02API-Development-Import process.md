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
           ) ci  //3、用"集装箱号"，"上链机构"，"提运单号"字段确定"箱业务信息表"的结果域。其中"集装箱号"、"提运单号"字段从入参类里获取。另类确定表的方法。
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
public ShipOptionDetailResp queryShipOptionInfo(ContImportQueryReq req) { //1、写好方法名、入参出参类型。
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



#### Mapper-Xml层：

```java

```









































































































































