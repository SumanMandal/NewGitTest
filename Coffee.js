var loopback = require('loopback');
var app = require('oe-cloud').app;
var coffeeasset = loopback.getModelByType('Coffee');
//var Realm = loopback.getModelByType('StakeholderUserManagement');

module.exports = function (coffeeasset) {
    
    coffeeasset.updateCustody = function (clientData,options,cb) {
        console.log("clientData - ",clientData);
        var transferredAsset = clientData.assetName;
        var assetModel = loopback.getModelByType(transferredAsset);
        var filter = {where:{id:clientData.assetId}};
        var currentAssetOwner ;
        var str = clientData.transferTo.replace(/,|superuser/g,"");
        var entityFilter = {where:{EntityLegalName:str}};

        assetModel.find(filter,options, function (err, result) {
            var response="";
            if(err){
                  response=err;
            }else{
                   var optionValue = JSON.stringify(options)
                   var tempOptions = JSON.parse(optionValue)
                    tempOptions.ctx.realmHierarchy = clientData.transferTo;
                    var temprs = result[0];
                   if (typeof result[0] !== 'undefined' && result[0] !== null) {
                      var currentoptions = JSON.parse(optionValue);
                      currentoptions.ctx.realmHierarchy = ",superuser,"+clientData.transferTo+",";
                     assetModel.upsert(temprs,tempOptions,function(err3,result3){
                        if(err3){
                          console.log("error came while transfer== ",err3);
                        }else{

                         var stakeholder = loopback.getModelByType('Stakeholder');
                         var notificationtable = loopback.getModelByType('NotificationTable'); 
                        stakeholder.find(entityFilter,options, function (entityError, entityResult) {
                            if(entityError){
                                console.log("error came while transfer== ",NotificationTable);
                            }else{
                                var notification ={
                                    "AssetId":clientData.assetId,
                                    "RecipientOrganization":str,
                                    "RecipientEntityId":entityResult[0].EntityId
                                };
                            notificationtable.create(notification,options,function(notificationError,notificationResult){
                                if(notificationError){
                                    console.log("error came while transfer== ",notificationError);
                                }else{
                                    console.log("Entry made to notificationtable ");
                                }
                            }); 
                           }
                        });
                     }
                    }); 
                    response="{success}";
                   }else{
                       response="can not find asset";
                   }
            }
             cb(null, response);
        
     }); 
     
    };
    
    coffeeasset.assetRegisteringLoop = function (assetArray, options, cb) {
        var assetTypeName = "";
        var assetPublish="";
        var assetCatalogueType = loopback.getModelByType('AssetCatalogueType');
        var filter = { where: { code: assetArray[0].AssetType } };
        assetCatalogueType.find(filter, options, function (err, result) {
            if (err) {
                console.log("error getting asset type == ", err);
            } else {
                console.log("Fetch assetType :- ",result[0].description);
                assetTypeName = result[0].description;
            }
        });
        console.log("Fetch assetType :- ",assetTypeName);

        assetPublish = loopback.getModelByType(assetTypeName);
        
        for (var i = 0; i < assetArray.length; i++) {
            console.log("Initiating Publish for :-  ", assetArray[i]);
            
            assetPublish.create(assetArray[i], options, function (errPub, resultPub) {
                if (errPub) {
                    console.log("error while Asset onboarding == ", errPub);
                } else {
                    console.log("Asset Created ", assetArray[i]);
                    console.log("Asset Created Result: - ", resultPub);
                }
            });
        }
        cb(null, "Asset posted for Split pls Check");
    };
    coffeeasset.GetHierarchey = function (assetId, options, callback) {
        console.log('started with :: ' + assetId);
        var result = [];
        var sankeyInput = [];
        let tempIdSet = [];
        tempIdSet.push(assetId);
        let callbackFn = function(resultEntry,id){
            let indexOfId1 = tempIdSet.indexOf(id);
           tempIdSet.splice(indexOfId1,1);
            if(resultEntry)
            {
                if( resultEntry.ParrentDetails){
                    //let tempParentId = [];
                    for (let parentId = 0, l = resultEntry.ParrentDetails.length; parentId < l; parentId++) {
                      // if (tempParentId.indexOf(resultEntry.ParrentDetails[parentId]+'')==-1) tempParentId.push(resultEntry.ParrentDetails[parentId]+'');
                       if (tempIdSet.indexOf(resultEntry.ParrentDetails[parentId]+'')==-1) tempIdSet.push(resultEntry.ParrentDetails[parentId]+'');
                        let sankeyElem = [resultEntry.ParrentDetails[parentId],id,1];
                        sankeyInput.push(sankeyElem);
                    }
                    coffeeasset.createHierarchey(tempIdSet[0],options, (resultEntry,id) => callbackFn(resultEntry,id));

                    /* tempParentId.forEach(function(value) {
                        console.log("inside  tempParentId :: "+value);
                        coffeeasset.createHierarchey(value,options, (resultEntry,id) => callbackFn(resultEntry,id));
                       
                    }); */
                }
                result.push(resultEntry);
            }
            else
            {
                if(tempIdSet.length == 0){
                    return callback(null, sankeyInput); 
                } 
            }
    };

        coffeeasset.createHierarchey(assetId,options, (resultEntry,id) => callbackFn(resultEntry,id));
        
    };

    coffeeasset.createHierarchey = function (id , options,cb ) {
            console.log("createHierarchey :: " +id);
            coffeeasset.findById(id,options, (err,data) => {
                let coffeeData =  data;
               
                if(coffeeData)
                {
                    cb(coffeeData,id);
                    if(coffeeData.ParrentDetails == null )
                    { 
                        cb(null,id);
                    }
                }
                else
                {
                    cb(null,id);
                }
            } )

    };
    coffeeasset.remoteMethod(
        'updateCustody', {
             accepts: { arg: 'clientData', type: {
            "assetId": "string",
            "transferTo": "string",
            "assetName":"string",
            "BlockChainIdentifier":"string"
            }, http: { source: 'body' } },
            returns: {type: 'string', root: true}, 
            http: {path: '/updateCustody', verb: 'post'}
           
        });

    coffeeasset.remoteMethod(
        'assetRegisteringLoop', {
            accepts: { arg: 'assetArray', type: 'array', http: { source: 'body' } },
            returns: { type: 'string', root: true },
            http: { path: '/AssetRegisteringLoop', verb: 'post' }

        });
        coffeeasset.remoteMethod(
        'GetHierarchey', {
            http: { path: '/:id/Hierarchey', verb: 'get' },
            accepts: { arg: 'id', type: 'string', required: true},
            returns: { type: 'array', root: true }
        });
}
