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

```java
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





























































































































