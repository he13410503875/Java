# 进口流程 API-Development 02

### 进口流程步骤一：一程船期确认，大船船期信息-接口：

#### Controller-Service层：

```java
@Override
public ShipShipmentDetailResp shipShipmentInfo(ContImportQueryReq req) {
    BigShipment shipInfo = bigShipmentMapper.queryShipShipmentInfo(req);
    ShipShipmentDetailResp resp = new ShipShipmentDetailResp();
    if(shipInfo!=null) {
        resp = shipShipmentDtMapping.entityToResp(shipInfo);
        List<OwnerInfo> ownerList = portBigShipmentOwnerInfoMapper.
            				selectDetailByOwner(shipInfo.getBigshipId());
        resp.setOwnerinfo(ownerInfoMapping.entityToResp(ownerList));
    } else {
        resp.setOwnerinfo(new ArrayList<~>());
    }
    return resp;
}
```

























































































































































