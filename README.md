# m3u8download.js
download m3u8 URL to mp4  下载m3u8视频合成一个完整的mp4  

## 功能
m3u8downloader是在chrome浏览器中运行的html和js，用于下载m3u8视频。  
当视频链接比如是https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8  
m3u8download可以自动分析m3u8文件，下载多个ts文件，视频是AES-128加密的，  
m3u8downloader进行解密后存为ts文件。并生成ffmepg用于concat的文件，可以  
用ffmpeg命令合成一个完整的mp4文件。  

## 特征
* 输入m3u8 URL,下载分析m3u8。  
* 下载m3u8中的嵌套的playlist,下载相关的m3u8 URL.
* 下载m3u8中的ts视频文件。
* 支持ts视频AES-128解密
* 生成ffmpeg命令需要的f.txt文件清单文件。
* 方便用ffmpeg命令将所有ts文件按f.txt的次序合成一个mp4文件。 
* 提供python文件检查下载失败的ts，可在文件名callback中定义，只下载指定的缺失文件。

## 使用方法
将m3u8index.html和dist目录copy到nginx的html目录。   
比如nginx安装在本地d:\nginx-1.80.0  
运行deploy.cmd  
copy m3u8*.html D:\nginx-1.18.0\html  
xcopy /E /Y dist D:\nginx-1.18.0\html\dist  

启动nginx,用chrome访问http://127.0.0.1/m3u8index.html， 在URL地址输入相关的m3u8地址。  
比如搜到电影《极限逃生》，在Chrome浏览器中按F12，看Network中m3u8URL是  
https://dbx5.tyswmp.com/20190910/oKHsD3EG/900kb/hls/index.m3u8，  
把这个地址复制到m3u8index.html页面中，点击"下载"钮就可以。  
 
## chrome浏览器配置
下载目录设置：chrome://settings/downloads  比如为d:\downloads  
自动下载设置: chrome://settings/content/automaticDownloads  必须允许http://127.0.0.1自动下载。  

## 合成mp4的方法：
安装ffmepeg for windows  
运行cmd。   
cd d:\downloads  
ffmpeg -f concat -i f.txt -c copy -y full.mp4  
这样就把所有的ts文件生成一个完整的full.mp4。  

## 错误处理
如果下载过程中f.txt文件中有而实际下载失败，可以运行python checktsfile.py   
将缺失文件定义到m3u8index.html中的 check_list_cb函数中filelist，再下载一次缺失文件就可以。  

## 编译方法：
npm install  
npm run build  

