
var DataStore = require('nedb');
var path = require('path');

var auser = require('../repo/ds/users/vogel-users.js').aappuser();

var fpaths = {
  root:'Vogel - IM/store/reports',
  archive:'archive',
  reports:{
    tech:'tech-reports.db',
    wo:'wo-reports.db',
    contract:'contract-reports.db'
  }
}

let repdb = null;
var FileReport = (name,data,month,year=null)=>{
  return new Promise((resolve,reject)=>{
    if(fpaths.reports[name]!=undefined && data&&data!=undefined){
      let file = '';
      if(year){file=path.join(auser.cuser.spdrive,fpaths.root,file,fpaths.archive,String(year)+'-'+fpaths.reports[name]);}
      else{file=path.join(auser.cuser.spdrive,fpaths.root,fpaths.reports[name]);}
      //try{
        repdb = new DataStore(file);
        repdb.loadDatabase();
        repdb.ensureIndex({fieldName:'month',unique:true});
      //}catch{return resolve(false)}
      if(month>=0 && month<12){data.month=month;}
      console.log(data);
      repdb.update({month:month},{$set:data},{},(err,numrep)=>{
        if(numrep!=0){
          console.log(numrep)
          repdb.persistence.compactDatafile();
          return resolve(true)
        }
        else{
          console.log(err);
          repdb.insert(data,(err,doc)=>{
            repdb.persistence.compactDatafile();
            console.log('Inserting');
            if(doc){return resolve(true)}
            else{return resolve(false)}
          });
        }
      });
    }
  })
}

var GetReports = (name,flts={},year=null)=>{
  return new Promise((resolve,reject)=>{
    if(fpaths.reports[name]!=undefined){//if is a report file
      let file = '';
      if(year){file=path.join(auser.cuser.spdrive,fpaths.root,file,fpaths.archive,String(year)+'-'+fpaths.reports[name]);}
      else{file=path.join(auser.cuser.spdrive,fpaths.root,fpaths.reports[name]);}

      repdb = new DataStore(file);
      repdb.loadDatabase();
      repdb.ensureIndex({fieldName:'month',unique:true});
      repdb.find(flts,(err,docs)=>{
        if(err){console.log(err);return resolve([])}
        else{return resolve(docs)}
      });
    }
  });
}


module.exports={
  FileReport,
  GetReports
}
