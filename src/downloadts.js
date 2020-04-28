import {Decrypter} from 'aes-decrypter';



export default class Tsdownloader {
  constructor(options,callback) {
    this.stoponerror=false;
    this.targets = [];
    this.targetindex=0;
    this.keysaved=null;
    this.callback=callback;
    this.workers=new Array();

    this.maxthreadcount=options.maxthreadcount;
    this.writetimeout=options.writetimeout;
    this.aarray=new Array();
    var i;
    for(i=0;i<this.maxthreadcount;i++){
        this.workers.push(new Worker(this.downloadedcallback.bind(this)));
    }

    this.specialmap={
'xxx.ts': true,
    };
    setTimeout(this.writeFile(),this.writetimeout);
  }
  push(data) {
     this.targets.push(data);
     return true;
  }

  writeFile(){
      if(this.aarray.length>0){
          this.aarray.shift().click();
      }
      setTimeout(this.writeFile.bind(this),this.writetimeout);
  }

  startWork(){
      if(this.targets.length ==0){
          return;
      }
     return new Promise(function (resolve,reject) {
          this.downloadKey(this.targets[0]).then(
              function (keystr) {
                  this.keystr=keystr;
                  setTimeout(function (){
                      this.downloadDispather();
                  }.bind(this),1);
              }.bind(this))
          .catch(e=>console.error(`error ${e}`));

     }.bind(this));
  }

  downloadKey(target){
    return new Promise(function (resolve,reject) {
        if (!target.key) {
            resolve('not need key');
            return;
        }

        if (this.keysaved) {
            resolve(this.keysaved);
            return;
        }

        var url = target.url;
        var key = target.key;
        var keyurl=key.uri;
        var newkeyurl='';

        if (keyurl.startsWith('/')) {
           var p=url.indexOf('://');
           var p1=url.indexOf('/',p+3)
           newkeyurl = url.substring(0, p1) + keyurl;

        } else {
            var p = url.lastIndexOf('/') + 1;
            newkeyurl = url.substring(0, p) + keyuri;
        }
      keyurl = newkeyurl;
      console.log(`start download key ${keyurl}`)


      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function (e) {
          if (xhr.readyState === 4) {
              if(xhr.status===200) {
                  console.log(`got key ${xhr.response}`);
                  this.keysaved = xhr.response;
                  resolve( xhr.response);
              }else{
                  reject(`download key error ${xhr.status}`);
                  return;
              }
          }
      }.bind(this);

      xhr.onerror=function () {
        reject('down load key error');
        return;
      }
      xhr.responseType = 'arraybuffer';
      xhr.open('GET',keyurl);
      xhr.send();
    }.bind(this));


  }

  downloadDispather(){
      if(this.stoponerror){
      //    alert('因为出现错误，停止');
       //   return;
      }

      if(this.hasWorker()==false){
          setTimeout(function () {
            this.downloadDispather()
          }.bind(this), 1 );
          return;
      }


      if(this.targetindex >= this.targets.length){
          console.log('all task finished');
          this.callback(`下载全部完成`);
          return;
      }

      var worker=this.fetchWorker();
      var target = this.targets[this.targetindex++];
      var keystr = this.keystr;
      worker.run(target,keystr) ;
      setTimeout(function () {
        this.downloadDispather();
      }.bind(this), 1);
  }

  downloadedcallback(worker,target,flag,result){
      console.log(`download flag=${flag},filename=${target.filename}`);
      if(flag==='error'){
          console.log(`error:${result}`);
          this.callback(`下载错误${target.filename}`);
          this.releaseWorker(worker);
          this.stoponerror=true;
          return;
      }

     if (!target.key || !target.key.uri) {
         this.downloadBlob(worker,result, target.filename);
         this.callback(`已下载${target.filename}`);
         return;
     }
     this.decryptTS(this.keystr, result).then(function (decrptdata) {
         this.downloadBlob(worker,decrptdata, target.filename);
         this.callback(`已下载${target.filename}`);
         return;
     }.bind(this));
  }


  decryptTS(keyContent, data){
      return new Promise(function (resolve,reject) {
        var viewkey = new DataView(keyContent);
        var keybytes = new Uint32Array([
            viewkey.getUint32(0),
            viewkey.getUint32(4),
            viewkey.getUint32(8),
            viewkey.getUint32(12)
         ]);
         var keyiv = new Uint32Array([ 0, 0, 0, 0 ]);
         var encdata=new Uint8Array(data);
         new Decrypter(
            encdata, keybytes,keyiv,function(err, decrptdata) {
                console.log('decrptdata ok');
                resolve(decrptdata);
            }
         );
        });
   }

   downloadBlob(worker,decrptdata,filename) {
       var blob = new Blob([decrptdata], {type: "video/mp4"});
       //var a = document.getElementById('a_blob')
       var a =document.createElement('a');
       filename=filename.replace(/[\/]/,'_');
       a.download = filename;
       a.href = URL.createObjectURL(blob);
       this.aarray.push(a);
       this.releaseWorker(worker);
       //var filereader = new FileReader();
       //filereader.onload = function (e) {
       //    var a = document.createElement('a');
       //    a.download = filename;
       //    a.href = e.target.result;
       //    a.click();
       //    this.releaseWorker(worker);
       //}.bind(this);
       //filereader.readAsDataURL(blob);
   }


   releaseWorker(worker){
      this.workers.push(worker);
   }

   hasWorker(){
      return this.workers.length>0;
   }

   fetchWorker(){
      return this.workers.shift();
   }

}

class Worker{
    constructor(callback) {
        this.callback=callback.bind(this);
    }

    run(target,keystr){
        this.xhr = new XMLHttpRequest();
        this.xhr.onreadystatechange=this.xhronreadystatechange.bind(this);
        this.xhr.onerror = function (e) {
              this.callback(this,this.target,'error',e);
        }.bind(this);
      console.log(`worker run ${target.filename}`);
      this.target=target;
      this.xhr.responseType = 'arraybuffer';
      this.xhr.open('GET',target.url);
      this.xhr.send(null);
    }

    xhronreadystatechange(){
      if (this.xhr.readyState === 4) {
          if(this.xhr.status===200) {
              this.callback(this,this.target,'ok',this.xhr.response);
          }else{
              this.callback(this,this.target,'error',this.xhr.status);
          }
          return;
      }
    }
}
