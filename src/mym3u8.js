import * as m3u8 from 'm3u8-parser';
import Tsdownloader from './downloadts';
import 'babel-polyfill';


function mym3u8(targeturl,options,filenamecallback,callback) {
  mym3u8.filenamecallback=filenamecallback;
  mym3u8.options = options;
  console.log(targeturl);
  mym3u8.callback = callback;
  var m3u8Parser =  new m3u8.Parser();

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function (e) {
    console.log(`this.readyState=${this.readyState}`);
    if (this.readyState === 4) {
      onXHRloaded(targeturl,this);
    }
  }

  xhr.onerror = function (e) {
    console.log(`error ${e}`);
  }

  function onXHRloaded(targeturl,xhr) {
    if(xhr.responseURL){
        targeturl = xhr.responseURL;
        console.log(`realurl=${targeturl}`);
    }
    var headstr = xhr.getAllResponseHeaders();
    var heads = headstr.split('\n');
    var i;
    var headmap = {};
    for (i = 0; i < heads.length; i++) {
      var s = heads[i].trim();
      if (s.length > 0) {
        var ss = s.split(': ');
        headmap[ss[0].trim()] = ss[1].trim();
      }
    }
    //console.log(headmap);

    if (xhr.status !== 200) {
      console.log(`error code ${xhr.status}`);
      return;
    }
    //vnd.apple.mpegurl
    if (headmap['content-type'].toLowerCase().indexOf('mpegurl') >= 0 ) {
        contenttypefuncmap['mpegurl'](targeturl,xhr.response);
    }else  if (headmap['content-type'].toLowerCase().indexOf('video/') >= 0) {
        contenttypefuncmap['video'](targeturl,xhr.response);
    }else{
        console.error(`不能处理${headmap['content-type']}`);
    }
    

  }

  function parsem3u8body(targeturl,response) {
    m3u8Parser.push(response);
    m3u8Parser.end();
    var manifest = m3u8Parser.manifest;

    if(manifest.playlists && manifest.playlists.length>0){
        manifest.playlists.forEach(playlist=> {
            var uri = playlist.uri;
            if(uri.indexOf('/240.m3u8')>=0){
                return;
            }
            if (uri.startsWith('/')) {
                var p=targeturl.indexOf('://');
                var p1=targeturl.indexOf('/',p+3)
                var newurl = targeturl.substring(0, p1) + uri;
                mym3u8(newurl, mym3u8.options,mym3u8.filenamecallback, mym3u8.callback);
            } else {
                var p = targeturl.lastIndexOf("/") + 1;
                var newurl = targeturl.substring(0, p) + uri;
                mym3u8(newurl, mym3u8.options, mym3u8.filenamecallback,mym3u8.callback);
            }

        });
    };

    if(manifest.segments && manifest.segments.length>0){
       var downloader = new Tsdownloader(mym3u8.options,mym3u8.callback);
       var i;
       var count=0;
       var filecontent="";
       manifest.segments.forEach(function (seg) {
          var fn=seg.uri;
          fn=fn.replace(/[\/]/g,'_');
          filecontent+='file '+fn+'\n';
       });
        var blob=new Blob([filecontent],{type: 'text/plain'});
        var a = document.createElement('a');
        a.download = 'f.txt';
        a.href = URL.createObjectURL(blob);
        a.click();


       for(i=0;i<manifest.segments.length;i++){
           var seg = manifest.segments[i];
            var key=seg.key;
            var tsuri = seg.uri;
            if(mym3u8.filenamecallback){
                if(!mym3u8.filenamecallback(tsuri)){
                    continue;
                }
            }
            var newtsurl="";
            if(tsuri.startsWith('/')){
                var p=targeturl.indexOf('://');
                var p1=targeturl.indexOf('/',p+3)
                newtsurl = targeturl.substring(0, p1) + tsuri;
            }else{
                var p=targeturl.lastIndexOf("/")+1;
                newtsurl=targeturl.substring(0,p)+tsuri;
            }
            console.log(`begin push ${tsuri}`);
            var ret = downloader.push({url: newtsurl,filename: tsuri,key: key});
       }
       downloader.startWork();
       console.log(`在mym3u8中等到所有ts下载完成`);
    }


  }

  xhr.open('GET', targeturl);
  xhr.send();

  var contenttypefuncmap={
    'mpegurl':function(url,response){
      parsem3u8body(url,response);
    },
    'video':function (url,response) {
        var p=url.lastIndexOf("/")+1;
        var filename=url.substring(p);
        console.log(`received video ${url} ${filename}`);
    }
  };




};

export default mym3u8;
