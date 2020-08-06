# API-Development-Workbench

需求页面分析：如下图，工作台可以分为5个模块开发。一个模块一个出参类，所以在一个controller层下开发5个接口。

![微信图片_20200703153942](C:\Users\admin\Desktop\pingan\API-Development-Workbench.assets\微信图片_20200703153942.jpg)

> 问：刚开始开发的时候是五个controller层，五个service层，调用一个mapper层。这样和一个controller层，一个service层，一个mapper层一样，功能都一样可以实现，有什么区别吗？
>
> 答：有区别，五个文件太多，打开几个接口直接满屏了。。不利于查看，维护和复用。
>
> 问：如何把五个controller层变成一个？五个service层变成一个？合并起来。
>
> 答：直接在一个controller下写五个方法，五个不同的匹配路径。而通过依赖注入service层，就可以调用同一个service下不同的五个方法，合并完成。



## 箱/船统计分析（折线图和柱状图）

#### Controller层：

新建Controller类。

```java
/*
 * 工作台 信息展示
 * @author ex-hezhenghao001 
 * @since 2020-06-17 //1、写好注释。
 */
@SLf4j
@Api(tags = "工作台") //2、写好类的swagger注释。
@RestController
@RequestMapping("/portWorkbench") //3、写好类的匹配路径。
public class PortWorkbenchController{
    
    @Autowired
    private PortWorkbenchService portWorkbenchService; //7、新建service文件，依赖注入。
    
    @ApiOperation("页面顶部左侧，艘次和箱量统计")
    ......(此接口略)
        
    @ApiOperation("箱/船统计分析（折线图和柱状图）") //4、写好方法的swagger注释。
    @GetMapping(value = "lineChart") //5、写好接口提交方式get/post。写好方法的匹配路径。
    @AuthPermissions
    public ResultBase<List<WorkbenchLineChartQueryResp>> lineChart(){ //6、新建出参类，确定方法名。
       
        return ResultUtil.ok(portWorkbenchService.lineChartQuery()); //8、调用service层方法，封装结果。
    }
}
```

- 承接上面的第6步，新建出参类：

  ```java
  @Data
  @Accessors(chain = true)
  @EqualsAndHashCode(callSuper = false)
  @ApiModel(description = "箱/船统计分析（折线图和柱状图）出参")
  public class WorkbenchLineChartQueryResp{
      
      /**
        * 月份
        */
      @ApiModelProperty("X轴-月份")
      private String month;
      
      /**
        * 箱量
        */
      @ApiModelProperty("箱量")
      private BigDecimal boxesNum;
      
      /**
        * 艘次
        */
      @ApiModelProperty("艘次")
      private BigDecimal bargesNum;
  }
  ```



#### Service层：

新建Intervice类。

##### Intervice：

```java
/**
  * 工作台 服务类
  * @author ex-hezhenghao001
  * @since 2020-06-18  //1、写好注释。
  */
public interface PortWorkbenchService{ //2、新建时自动完成了类名。
    
    ......工作台-头部信息查询（略）
        
    /**
      * 工作台-箱/船统计分析 折线图
      * @param 
      * @return  //3、写好方法注释。
      */
     List<WorkbenchLineChartQueryResp> lineChartQuery(); //2、确定接收类型和方法名。
}
```

新建Impl实现类。

##### Impl：

```java
/**
  * 工作台 服务实现类
  * @author ex-hezhenghao001
  * @since 2020-06-17  //1、写好注释。
  */
@Service
public class PortWorkbenchServiceImpl implements PortWorkbenchService{ //2、实现Service类。
    
    @Autowired 
    private PortContOptinMapper contOptmapper;
    
    @Autowired
    private PortBargeShipmentMapper bshipmentMapper;
    
    ......工作台-头部信息查询（略）
    
    @Override
    public List<WorkbenchLineChartQueryResp> lineChartQuery(){ //3、alt+enter快捷添加重写方法。
      List<WorkbenchLineChartQueryResp> respList = new ArrayList<WorkbenchLineChartQueryResp>();
      //4、创建出参类对象。
      Calendar cal = Calendar.getInstance();//5、创建calendar对象。
      cal.setTime(new Date()); //6、保存当前时间。
      cal.set(Calendar.HOUR_OF_DAY,0); //设置小时为0.
      cal.set(Calendar.MINUTE,0); //设置分钟为0.
      cal.set(Calendar.SCOND,0); //设置秒钟为0.
      Date endTime = cal.getTime(); //获取时间赋值给endTime。
      cal.add(Calendar.DAY_OF_MONTH,-7); //调用add方法，把当前日期往前推7天。
      Date startTime = cal.getTime(); //获取推前了的时间赋值给startTime。
        
      List<ContOptin> contList = contOptMapper.statisticsOptInfoByTime(startTime,endTime);//7、调用mapper层方法,传入两个时间参数，获得箱列表数据。
      List<BargeShipment> shipList = bshipmentMapper.statisticsShipmentByTime(startTime,endTime); //8、调用mapper层方法，传入两个时间参数，获得艘次列表数据。
        
     SimpleDateFormat sf = new SimpleDateFormat("yyyy-MM-dd"); //9、创建日期格式化对象。
       while(startTime.compareTo(endTime) < 0 ){ //10、编写while（）循环，用startTime和endTime作比较作循环条件。减去7天的开头时间小于当前时间即进入循环。
           WorkbenchLineChartQueryResp r = new WorkbenchLineChartQueryResp(); //11、新建视图类对象。
           String month = sf.format(startTime); //12、按“yyyy-MM-dd”格式化startTime。
           r.setMonth(month);//13、视图类对象保存格式化后的开头时间。
           r.setBoxesNum(new BigDecimal(0));
           r.setBargesNum(new BigDecimal(0));//14、对象调用set()方法，保存零，初始化箱量和艘次。
           for(int j = 0; j < contList.size(); j++){//15、编写for循环，用箱列表数据长度作循环条件。
                if(month.equals(contList.get(j).getMonth())){//16、取出一行箱列表数据里的"时间"再和开头时间作比较。两时间相等即进入循环。
                    r.setBoxesNum(contList.get(j).getBoxesNum());//17、取出一行箱列表数据里的"艘次"数据。视图对象再保存这个数据。
                    break;//18、跳出这个循环。
                }
            }
            for(int j = 0; j < shipList.size(); j++){//19、编写for循环，用艘次列表数据作循环条件。
                if(month.equals(shipList.get(j).getMonth())){//20、取出一行艘次列表数据里的"时间"再和开头时间作比较。两时间相等即进入循环。
                    r.setBargesNum(shipList.get(j).getBargesNum());//21、取出一行艘次列表数据里的"箱量"数据。视图对象保存这个数据。
                    break;//22、跳出此循环。
                }
            }
            
            cal.setTime(startTime);//23、calender对象保存开头时间
            cal.add(Calendar.DAY_OF_MONTH，1);//调用add方法加一天时间
            startTime = cal.getTime();//再获取开头时间，会再进入循环，再跟endTime当前时间作比较。
            
            respList.add(r);//24、出参类列表对象调用add()方法添加视图对象。
        }
        return respList;//25、循环结束，直接返回出参类列表对象。
    }
}
```



#### Mapper-->Xml层：

在工作台PortWorkbench.xml下：

> 需求 ： 工作台顶部左侧 -- 统计含有HOTBOX的船艘次。

```java
<!--HOTBOX船艘次-->
<select id="HBbargesQuery" resultType="java.math.BigDecimal">
    select
       count(distinct imo)  //1、：一开始写SQL语句，老想着怎么用count（）把所有含有HOTBOX的船全部合计出来。其实直接判断hotbox不为空 is not null 即可。。简单明了！反向思维！
    from
       block_record_barge_shipment
    <where>
       hotbox is not null and hotbox != ""
    </where>
</select>   
```



在箱操作mapper-xml文件下。

```java
<!--表名-->
<sql id="table">
    (select <include refid = "Base_Column_List" />
      from block_record_cont_optin
     union all
     select <include refid = "Base_Column_List /">
      from block_record_cont_optout)
</sql>

<!--统计一段时间内的集装箱数量，目前是最近7天，按天统计-->  //1、做好注释。
<select id = "statisticsOptInfoByTime" resultMap = "BaseResultMap"> //2、写好方法名。
   select tmp2.opttime month,count(*) boxesNum from( //4、从结果集里取月份和箱数。
       select distinct date_format(tmp.opttime,'%Y-%m-%d') opttime,tmp.containerno
          from <include refid ="table" /> tmp
          where
          tmp.opttime >= #{startTime}
          and tmp.opttime < #{endTime} //3、取操作时间在两个时间参数中间的去重数据。
    ) tmp2 group by tmp2.opttime order by tmp2.opttime
</select>
```

在驳船船期信息mapper-xml文件下。

```java
<!--艘次统计-->
<sql id="statisticsSql">
    select distinct date_format(IFNULL(bs.atb_time,bs.eta_time),'%Y-%m-%d') atb_time,
				   date_format(bs.atd_time,'%Y-%m-%d') atd_time,
				   bs.imo
   from block_record_barge_shipment bs //1、从驳船船期表里取出停泊时间和离港时间和imo。
   where (IFNULL(bs.atb_time,bs.eta_time) >= #{startTime} and bs.atd_time < #{endTime})
     or (IFNULL(bs.atb_time,bs.eta_time) >= #{startTime} and bs.atd_time is null )//2、用停泊时间大于开头时间，离港时间大于结束时间的区间范围时间作where子句条件。
</sql>

<!--招商工作台，箱/船统计分析，船统计，每条船每一天至多只当做一条记录来统计-->
<select id="statisticShipmentByTime" resultMap="BaseResultMap">
    select month,count(*) bargesNum from(
      select atb_time month,imo from(
          <include refid="statisticsSql" />
      ) t where t.atbtime is not null //3、从子函数中取出停泊时间，月份。停泊时间不为null为查询条件。
    
    union
    
    select atd_time month,imo from(
         <include refid="statisticsSql" />
      ) t where t.atdtime is not null //4、从子函数中取出离港时间，月份。离港时间不为null为查询条件。用union连接两张表结果。停泊时间怎么可以跟离港时间同时展示出来呢？因为上面说每条船每一天至多只当做一条记录来统计。所以不能既停泊，又离港。
    
    ) tmp group by month order by month //5、取出合并了的停泊和离港时间结果为月份，统计数据行数为船艘次。用月份分组和排序。
</select>
```



## 箱量统计(切换系统)：

#### controller层：

```java
@ApiOperation（"箱量统计"）  //1、写好方法的swagger注释。
@GetMapping（value = "boxesTotel"） //2、确定提交方式。写好方法匹配路径。
@AuthPermissions
public ResultBase<WorkbenchBoxesTotalQueryResp> boxesTotal(){ //3、确定返回类型，新建出参类，写好方法名。
    return ResultUtil.ok(portWorkbenchService.boxesTotalQuery()); //4、调用service层方法，封装结果。
}
//5、如下三个接口之前都是出参字段，都在箱量统计接口出参类里。但前端页面老显示接口超时，因为这些字段的计算方法统计超时了，所以拆分成几个接口。（计算过程超时5秒，对现在网页速度来说，对聚合接口来说已经不短了。）
@ApiOperation（"箱量统计-MCT"） 
@GetMapping（value = "MCT"）
@AuthPermissions
public ResultBase<BigDecimal> boxesTotalMCT(){
    
    return ResultUtil.ok(portWorkbenchService.boxesTotalMCTQuery());
}

@ApiOperation（"箱量统计-SCT"）
@GetMapping（value = "SCT"）
@AuthPermissions
public ResultBase<BigDecimal> boxesTotalSCT(){
    
    return ResultUtil.ok(portWorkbenchService.boxesTotalSCTQuery());
}

@ApiOperation（"箱量统计-CCT"）
@GetMapping（value = "CCT"）
@AuthPermissions
public ResultBase<BigDecimal> boxesTotalCCT(){
    
    return ResultUtil.ok(portWorkbenchService.boxesTotalCCTQuery());
}
```



#### Service层：

##### Intervice：

```java
 /**
   * 工作台-箱量统计
   * @param
   * @return  //1、写好注释。
   */
 WorkbenchBoxesTotalQueryResp boxesTotalQuery(); //2、写好返回类型和方法名。

 /**
   * 拆分-箱量统计接口
   * @return
   */
 BigDecimal boxesTotalMCTQuery();
 BigDecimal boxesTotalSCTQuery();
 BigDecimal boxesTotalCCTQuery();

```

##### 箱量统计--Impl：

```java
@Autowired
private PortContOptinMapper contOptMapper;

@Override
public WorkbenchBoxesTotalQueryResp boxesTotalQuery(){ //1、alt+enter自动重写方法。
    
    WorkbenchBoxesTotalQueryResp resp = new WorkbenchBoxesTotalQueryResp(); //2、创建出参类对象。
    
    resp.setNowTime( new SimpleDateFormat("yyyy/MM/dd HH:mm").format(new Date()) + ""); //3、出参类对象调用set（）方法存入当前时间。方法里创建日期格式对象，确定日期格式为“yyyy/MM/dd HH：mm”，调用format（）方法，格式化当前时间对象new Date（）。最后转为字符串，跟出参类字段类型保持一致。
    //在场箱
    if(getPortInfoCfg().getSystemFlag().equals("PORT_SCCT")){ //4、因为工作台要切换江门系统和深圳招商系统，可以用“系统标识”作判断。属于港口标识“PORT_SCCT”，则走港口方法，不属于则走另一方法。
        resp.setFieldbox(fieldAddNum("SCCT"));  //5、出参类对象调用set（）方法保存“在场箱”字段数据。调用fieldAddNum（）方法。传入总码头 “SCCT” 字段，因为这里 “箱量统计的在场箱” 是 “招商港口所有码头的在场箱” 数据。
    }else{
        resp.setFieldbox(fieldAddNum("CNWAI")); //6、如果系统标识是江门“PORT_JM”，则走此方法。江门只有一个码头，所以只需要传入一个码头即可！
    }
    resp.setInshipbox();
    resp.setOnbargeboxes();
    resp.setOnbigshipboxes();
    return resp; //7、封装剩下数据，返回结果。
}

public BigDecimal fieldAddNum(String terminal){ //5.1、在场箱统计算法的代码可以提取出来作为一个方法，这么多行代码就不用重复写多次。新建方法，确定方法名，返回类型，方法参数。
    //总提离箱量
    BigDecimal totalLiftOff = contOptMapper.queryTotalHeavyBoxByDock(
        terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr()); 
    //已卸量
    BigDecimal uninstall = conOptMapper.queryUnloadedBoxByDock(terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr());
    //总还重箱量
    BigDecimal totalHeavy = contOptMapper.queryTotalHeavyBoxByDock(
        terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr());
    //已装量
    BigDecimal boxed = contOptMapper.queryBoxedByDock(
        terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr());//5.2、调用mapper层方法，传入码头字符串，传入系统标志，传入子码头数组。。xml的sql语句里有系统切换的判断，根据传入的系统标志和总码头的判断，切换不同的子码头数组来查询数据，不同系统的都是用一样的表。上面这些方法都有作不同系统 的切换，所以以后写sql语句要考虑各种情况。
    
    //在场箱，在场箱=还重-已装+已卸-出闸+其他在场
    BigDecimal totalPresent = totalHeavy.subtract(boxed).add(uninstall).subtract(totalLiftOff);
    if(totalPresent.compareTo(new BigDecimal(0))<0){
        totalPresent = new BigDecimal(0); //5.3、统计结果并防止箱量负数的情况出现，作个判断。
    }
    return totalPresent; 
}

/**
  * 根据登录用户所属港口，返回对应港口的枚举数据
  * @return
  */
@Override
public portInfoEnum getPortInfoCfg(){ //4.1，编写方法，返回枚举类。新建枚举类。
    String systemFlag = getSystemFlag();
    PortInfoEnum[] port = PortInfoEnum.values();
    for(int i=0; i<port.length; i++){
        if(port[i].getSystemFlag().equals(systemFlag)){
            return port[i]; //4.3、枚举类里的系统标识与用户信息里的系统标识作比较，如果相等则返回。
        }  
    }
    return PortInfoEnum.PORT_SCCT; //4.4、都不相等的情况，返回港口标识。
}

/**
  * 获取系统唯一标识，判断是哪个港口系统
  * @return
  */
@Override
public String getSystemFlag(){
    UserQueryResp user = sysService.queryLoginUser(); 
    return user.getSystemFlag(); //4.2、从service中获取用户信息，再取出系统标识。
}
```

- 承接上面第4.1步，枚举类：

  ```java
  /**
    * 港口信息配置
    * @author ex-hezhenghao001
    */
  @Getter
  public enum PortInfoEnum{
      PORT_SCCT("PORT_SCCT","SCCT",new String[] {"SCT","MCT","CCT"}, "招商港口"),
      PORT_JM("port_SCCT","CNWAI",new String[] {"CNWAI"},"江门港口"),
      
      private String systemFlag;// 系统标识，PORT_SCCT标识招商港口系统，PORT_JM标识江门港口系统
      private String portFlag;// 标识港口下所有的码头，也即这个字符串代表所有的码头
      private String[] subTerminalArr;// 包含港口下的所有子码头
      private String desc;//描述
      
      PortInfoEnum（String systemFlag, String portFlag, String[] subTerminalArr,String desc）{
          this.systemFlag = systemFlag;
          this.portFlag = portFlag;
          this.subTerminalArr = subTerminalArr;
          this.desc = desc;
      }
  }
  ```

  

##### 拆分接口--Impl：

解决接口超时问题。

```java
/**
  * 拆分接口
  * @return
  */  //1、写好注释。
@Override
public BigDecimal boxesTotalMCTQuery(){ //2、自动重写方法。
    if(getPortInfoCfg().getSystemFlag().equals("PORT_SCCT")){ //3、因为江门港口只有一个码头，所以跟前端说 “招商码头跟江门码头” 只需要调用这个MCT同一个接口即可。后台会做判断，切换不同的系统标识的时候去查询出不同的数据。
        return percentCalculate("MCT"); //4、调用方法，传入招商码头字符串直接得到数据。
    }else{
        return percentCalculateTwo("CNWAI"); //5、切换到江门码头，调用方法，传入江门码头字符串得到码头箱量数据。
    }
}

@Override
public BigDecimal boxesTotalSCTQuery(){
    return percentCalculate("SCT");
}

@Override
poublic BigDecial boxesTotalCCTQuery(){
    return percentCalculate("CCT"); //6、不用作切换系统判断。直接重写方法，调用方法，传入码头得到数据。
}

public BigDecimal boxesAddNum(String terminal){ //4.1、总箱量统计方法代码抽取出来，方便复用。
    //总还重箱量
    BigDecimal totalHeavy = contOptMapper.queryTotalHeavyBoxByDock(terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr());
    //总卸箱量
    BigDecimal totaluninstall - contInfoMapper.queryTotalUnloadingBoxByDock(terminal,getPortInfoCfg().getPortFlag(),getPortInfoCfg().getSubTerminalArr());  //4.2、这些mapper层的方法也都是可以作不同系统判断。
    //总箱量，》总箱量=总还重箱量+总卸箱量
    return totalHeavy.add(totalUninstall); //4.3、统计结果并返回。
}

public BigDecimal percentCalculate(String terminal){ //4.4、招商码头箱量统计 计算百分比的代码也抽取出来，方便复用。
    BigDecimal  a = boxesAddNum(terminal);
     BigDecimal  b = boxesAddNum("SCCT"); 
    if(b.compareTo(new BigDecimal(0)) == 0 ){
        return new BigDecimal(0); ///4.6、避免除数为0报错，作个判断。
    }
    BigDecimal c = a.divide(b,2,RoundingMode.HALF_UP).multiply(new BigDecimal(100)); //4.5、招商码头三个其中一个除以总码头箱量数据，保留两位小数，再乘以100。现在是饼状图只有这三个码头有数据，先这样计算，之后再加。
    return c;
}

public BigDecimal percentCalculateTwo(String terminal){ //4.7、江门码头的百分比统计代码也取出来了。
    BigDecimal  a = boxesAddNum(terminal);
     BigDecimal  b = boxesAddNum(terminal);
    if(b == null ){
        return new BigDecimal(0); //4.8、避免余数为零的判断。
    }
    BigDecimal c = a.divide(b,2,RoundingMode.HALF_UP).multiply(new BigDecimal(100)); //4.9、饼状图只有一个码头的数据，先自己除以自己。最后返回结果。
    return c;
}
```



#### Mapper：

主要是fieldAddNum( ) 和 boxesAddNum( ) 里的各个方法为主要方法。因为业务不太熟，所以在下面只列举几个。

```java
/**
  * 根据指定的码头查询已装箱量
  *
  * @param terminal
  * @param portFlag
  * @param subTerminalArr
  */
BigDecimal queryBoxedByDock(@Param("terminal") String terminal, @Param("portFlag") String portFlag, @Param("subTerminalArr") String[] subTerminalArr);

/**
  * 根据指定的码头查询已卸箱量
  *
  * @param terminal
  * @param portFlag
  * @param subTerminalArr
  */
BigDecimal queryUnloadedBoxByDock(@Param("terminal") String terminal, @Param("portFlag") String portFlag, @Param("subTerminalArr") String[] subTerminalArr);
```



##### Xml层：

切换不同系统的sql语句。

```java
<!--根据指定的码头查询已装箱量-->
<select id="queryBoxedByDock" resultType="java.math.BigDecimal">
    SELECT
    	count(*)
    FROM
    	（
      SELECT distinct op.containerno FROM <include refid="table" /> op,block_record_cont_info ci
      <where>
    	 ((op.containerno=ci.containerno and op.do=ci.do)
         or (op.containerno=ci.containerno and op.bl=ci.bl))
         and op.opttype='装船'   //1、信息表跟操作表关联。
         <choose>
         	<when test="terminal == portFlag">
         		and op.terminalcode in
         		<foreach item="item" collection="subterminalArr" separator="," open="(" close=")" index="">
                  #{item,idbcType=VARCHAR}
				</foreach>
				
                 and ci.pol in
                 <foreach item="item" collection="subterminalArr" separator="," open="(" close=")" index="">
                 #{item,idbcType=VARCHAR}
				</foreach>
			</when>  //2、用when判断和foreach循环语句，分辨不同系统标识，遍历港口名称数组。
             <otherwise>
             	and op.terminalcode = #{terminal}
			   and ci.pol = #{terminal}
			</otherwise> //3、如果标识不相等，则直接传入码头参数，装货港参数。
		</choose>
        </where>
     )tmp
  </select>  
  

<!-- 根据指定的码头查询总提离箱量 -->
<select id="queryUnloadedBoxByDock" resultType="java.math.BigDecimal">
	SELECT
		count(*)
   	FROM
   		(
   		SELECT distinct op.containerno FROM <include refid="table" /> op,block_record_cont_info ci
   		<where>
   		   ((op.containerno=ci.containerno and op.do=ci.do)
           or (op.containerno=ci.containerno and op.bl=ci.bl))
            and op.opttype='出闸'  //4、信息表跟操作表关联。
            <choose>
            	<when test="terminal == portFlag">	
                 and ci.pod in
                 <foreach item="item" collection="subterminalArr" separator="," open="(" close=")" index="">
                 	#{item,idbcType=VARCHAR}
				</foreach>
			</when>
             <otherwise>
			   and ci.pod = #{terminal}
			</otherwise>
		</choose>
        </where>
     )tmp
  </select>  //5、也是用判断和循环，分辨系统作不同操作。发现在业务上要分不同的系统，只需要在xml的sql加这些判断语句跟循环语句即可！
```



## 船艘次统计：（略）





## 页面右下角，码头箱量信息统计：（略）











































































































































