var fs = require('fs');
var {aappuser} = require('./repo/ds/users/vogel-users.js');

let locpath = 'C:/IMDB/rrq/';
let usetfile = 'userset.json';
var auser = null;

try{
  auser = require(locpath + usetfile);
}catch{auser = aappuser()}

console.log(auser);

//  User Functions //
var SETUPappuser=(users,uname=null,pswrd=null)=>{
  if(users[uname]!=undefined){
    auser.uname = uname;
    auser.pswrd = pswrd;
    auser.config = users[auser.uname];

    fs.writeFileSync(locpath+usetfile,JSON.stringify(auser))
    return true;
  }else{return false}
}
var RESETappuser=()=>{
  auser.uname = '',
  auser.pswrd = '',
  auser.config = {};
  fs.writeFileSync(locpath+usetfile,JSON.stringify(auser))
}

module.exports={
  auser,
  SETUPappuser,
  RESETappuser
}
