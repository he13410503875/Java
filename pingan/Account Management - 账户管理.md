# Account Management - 账户管理

#### 登录接口：

需求原型图。

![580](F:\Java-Route\pingan\Account Management - 账户管理.assets\580.png)

#### Controller层:

```java
@ResponseBody   //1、用此响应注解，返回一个用户实体类。返回众多用户信息。
@PostMapping(value = "login")
@ApiOperation("登录")
@AuthPermissions(needLogin = false)   //2、登录接口不拦截。
public ResultBase<UserQueryResp> login(@Valiated @RequestBody LoginReq loginReq) { //3、创建出参/入参实体类。形参用@Valiated注解，跟入参实体类属性里的@NotBlank注解搭配使用，不然@NotBlank没作用。
    log.info("登录，入参：loginReq={}", JSON.toJSONString(loginReq));
    UserQueryResp loginUser = sysService.login(loginReq);
    return ResultUtil.ok(loginUser);//4、调用方法，封装结果，返回结果。
}
```

##### Entity层：

承接上面第3步的入参实体类：

```java
@Data
@ApiModel(description = "登录")
public class LoginReq{
    
    /**
      * 用户账户名 (例如：ZHANGSAN001)
      */
    @Notblank(message = "用户账号名不能为空") //1、非空判断注解，在控制台会打出异常信息。配合@Valiated注解使用。
    @Pattern(regexp = "[0-9a-zA-Z]+", message = "非法用户名格式，仅支持英文字符与数字") //2、规定数据格式。
    @ApiModelProperty(value = "用户账户名(例如：ZHANGSAN001)", required = true)
    private String userName;
    
    /**
      * 用户密码（明文）
      */
    @NotBlank(message = "用户密码不能为空") //3、非空判断。
    @ApiModelProperty(value = "用户密码（明文）"，required = true)
    private String userPassword;
    
    /**
      * 图片验证码
      */
    @NotBlank(message = "图片验证码") //4、非空判断。
    @ApiModelProperty(value = "图片验证码"， required = true)
    private String validCode;
}
```



#### Service -> ServiceImpl 层：

##### PortSysServiceImpl.java:

```java
@Value("$sys.blockchain.id")
private String sysBlockchainId;

@Override
public UserQueryResp login(LoginReq loginReq){
    // 1、登录图片验证码
    String validCode = loginReq.getValidCode();
    // 2、验证图片是否正确。创建SessionConstants类，主要是存入session中的key值。比如SessionConstants.loginValidCodeKey 为分布式session的验证码的key值常量。
    this.checkValidCode(SessionConstants.loginValidCodeKey, validCode);
    
    // 3、用户账号名（例如：ZHANGSAN001)
    String userName = loginReq.getUserName();
    // 4、用户密码（rsa公钥--前端公钥加密）
    String userPassword = loginReq.getUserPassword();
    // 5、rsa私钥--后端私钥解密
    userPassword = this.decryptRSAPrivateKey(userPassword);
    
    // 6、校验用户名密码是否正确
    this.checkUserNamePwd(userName, userPassword);
    
    // 7、判断是否需要修改密码。新建AppConstants类，存储应用内常用的常量。比如：初始化密码为     public static final String PWD= “88888888";
    boolean needUpdatePwdFlag = AppConstants.PWD.equals(userPassword);
    if(needUpdatePwdFlag) {
        ExceptionEnum exceptionEnum = ExceptionEnum.PWD_NEDD_UPDATE;
        throw ServiceException.of(exceptionEnum);
    }
    
    // 8、获取数据库中用户的信息
    UserQueryResp loginUser = userService.detailByUserName(userName)；
    // 9、这些信息太冗余，前端页面不需要此类信息。
    loginUser.setResourceList(null);
    // 10、系统的链上唯一的ID
    loginUser.setSysBlockchainId(sysBlockchainId);
    
    // 11、将数据库中用户的信息，存入分布式的redis-session中
    HttpSession httpSession = request.getSession();
    String sessionId = httpSession.getId();
    loginUser.setSsoToken(sessionId);
    loginUser.setSystemFlag(systemFlag);
    httpSession.setAttribute(SessionConstants.loginUserKey, loginUser);
    login.info("登录成功，当前登录者信息，sessionId={}，loginUser={}", sessionId, JSON.toJSONString(loginUser))；
        
    // 12、登录成功后，将登录者信息转换为sso登录者信息，然后存入redis中。
    SsoLoginUserResp ssoLoginUserResp = this.transSsoLoginUserResp(loginUser);
    String ssoSessionKey = RedisKeyConstans.ssoSessionKey + sessionId;
    String ssoLoginUserRespStr = Json.toJSONString(ssoLoginUserResp);
    redisUtil.set(ssoSessionKey, ssoLoginUserRespStr, SessionConstants.maxInactiveIntervalInSeconds);
    log.info("登录成功后，将登录者信息转换为sso登录者信息，然后存入redis中。ssoSessionkey={},ssoLoginUserResp={}", ssoSessionKey, JSON.toJSONString(ssoLoginUserResp));
    
    return loginUser;
}
44

/** 
  * 校验图片验证码
  * @param validCodeKey
  * @param loginValidCode
  */
private void checkValidCode(String validCodeKey, String loginValidCode) { //2.1、承接上面第2步。
    // 验证图片是否正确，图片验证码只能使用1次
    HttpSession httpSession = request.getSession();
    String sessionid = httpSession.getId();
    String sessionLoginValidCode = (String) httpSession.getAttribute(validCodeKey);
    // 图片验证码只能使用1次
    httpSession.removeAttribute(validCodeKey);
    log.info("图片验证码是否正确，sessionId={},sessionLoginValidCode={}", sessionId, sessionLoginValidCode);
    
    if(!loginValidCode.equalsIgnoreCase(sessionLoginValidCode)) {
        ExceptionEnum exceptionEnum = ExceptionEnum.VALID_CODE_FAIL；
        throw ServiceException.of(exceptionEnum);
    }
}


private void checkUserNamePwd(String userName, String userPassword) { //6.1、承接上面第6步。写好方法名，传入账户名和密码。
    // 构造查询条件
    QueryWrapper<PortSysUser> queryWrapper = new QueryWrapper<>(); //6.2、调用mybatisplus的条件构造器QueryWrapper，用于生成 sql 的 where 条件。
    queryWrapper.eq("status", AppConstants.STATUS_OK).eq("user_name", userName); //6.3、调用eq()方法，相当于“=”符号.
    PortSysUser user = userService.getOne(queryWrapper); //6.4、调用mybatisplus自带的CURD接口，连xml都不用写，直接可以从数据库取出数据。
    boolean flag = false;
    
    if(user != null) {
        // 数据库中的密码是密文
        String dbUserPassword = user.getUserPassword();
        // 对明文密码进行1次MD5加密
        String md5UserPassword = userService.md5Pwd(userPassword);
        // 2个密文密码相同，则校验用户名密码通过。
        flag = md5UserPassword.equals(dbUserPassword);
    }
    
    if(!flag) {
        ExceptionEnum exceptionEnum = ExceptionEnum.USER_NAME_PWD_FAIL;
        throw ServiceException.of(exceptionEnum);
    }
}
```

##### Tips：

> Mybatisplus的 CURD接口 使用注意事项：
>
> 1、要添加mybatisplus依赖。
>
> 2、配置文件要添加并开启mybatisplus配置。
>
> 3、如上6.4步。注入对象的接口类要继承IService<PortSysUser>接口，注入对象的实现类要继承ServiceImpl<PortSysUserMapper, PortSysUser>接口，指定对应的mapper类和实体类。这样才能找得到是哪张数据库表。这一步也就代替了配置文件里的扫描实体类配置。



##### PortSysUserServiceImpl.java:

承接上面第8步：获取数据库中用户的信息.

```java
@Override
public UserQueryResp detailByUserName(String userName) { //8.1、写好方法名和形参。
    userName = Optional.ofNullable(userName).orElseThrow(() ->  
                                   ServiceException.of(ExceptionEnum.USER_NAME_NULL));
    PortSysUser sysUser = this.userMapper.selectDetailByUserName(userName); //8.2、调用mapper层方法，获取用户数据。
    log.info("sysUser={}", JSON.toJSONString(sysUser));
    UserQueryResp userQueryResp = this.mapping.entityToResp(sysUser);
    // 8.3、处理角色集合+菜单按钮资源集合
    this.assignRoleAndresource(sysUser, userQueryResp);
    return userQueryResp;
}

/**
  * 处理角色集合+菜单按钮资源集合
  * @param sysUser
  * @param userQueryResp
  */
private void assignRoleAndresource(PortSysUser sysUser, UserQueryResp userQueryResp) //8.3.1、承接上面8.3步，写好方法名和形参。
    if(sysUser != null) {
        if(!CollectionUtils.isEmpty(sysUser.getRoleList())) {
            List<RoleQueryResp> roleList = sysUser.getRoleList().stream().map(role -> 
this.mapping.roleToRoleQueryResp(role)).collect(Collectors.toList()); //8.3.2、取出"角色集合"列表数据。调用流stream() API，map和lambda表达式可用于映射每个元素到对应的结果。Collectors 可用于将流转换成集合和聚合元素，返回列表或字符串。这里把用户数据中的“角色数据库表实体类”，转化成“角色查询结果出参实体类”。
            
            Set<String> roleCodeSet = roleList.stream().
map(RoleQueryResp∷getRoleCode).collect(Collectors.toSet()); //8.3.3、方法引用∷，引用了出参类的获取角色编码方法getRoleCode()。相当于lambda表达式，role -> RoleQueryResp.getRoleCode()的简化版。。引用的这个方法有时会不一样，但代替的都是匿名内部类里的方法。我认为这里是把"实体类"数据映射转化为角色编码数据。
//RoleList列表数据是怎么来的？里面有几个数据？  答： 根据下面"用户数据"的sql语句可知。是把几个角色表里的字段映射进列表"角色集合"字段里。很可能列表字段里只有一个数据，所以取出的"角色编码"也只有一个数据。但也把他们放进了集合里。
            userQueryResp.setRoleList(roleList);
            userQUeryResp.setRoleCodeSet(roleCodeSet);  //8.3.4、保存"角色集合"和"角色编码"集合数据。
        }
        
        if(!CollectionUtils.isEmpty(sysUser.getResourceList())) {
            List<ResourceQueryResp> resourceList = sysUser.getResourceList().stream().map(
resource -> this.mapping.resourceTOResourceQueryResp(resource)).
collect(Collectors.toList()); //8.3.5、获取"菜单按钮集合"数据。
            Set<String> permissionCodeSet = Sets.newLinkedHashSet();
            resourceList.stream().map(ResourceQueryResp∷getPermissionCode).sorted(Comparator.naturalOrder()).forEach(PermissionCodeSet∷add); //8.3.6、从"菜单按钮资源查询结果出参实体类"里取出"权限编码"数据。sorted用于排序，Comparator.naturalOrder()(返回按照大小写字母排序的Comparator)，forEach用于迭代。
            
            userQueryResp.setResourceList(resourceList);
            uwerQueryResp.setPermissionCodeSet(permissionCodeSet);  //8.3.4、保存"菜单按钮集合"和"权限编码"集合数据。
        }
    }
}
```

###### Tips：

> Lambda表达式使用方法：
>
> 1、一个方法的形参是接口对象。。把接口对象想象成匿名内部类，替代的就是这个。
>
> 2、直接（） ->  匿名内部类的方法。即可！函数式编程强调做什么，而不是怎么做？























































































































