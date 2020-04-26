import  os

if __name__ == '__main__':
   dir = r'd:/downloads/'
   with open(dir+'f.txt') as f:
      lines = f.readlines()
      filenames = [line.split()[1] for line in lines]

      '''检查文件是否存在'''
      for filename in filenames:
         path = dir+filename
         if os.path.exists(path) is False:
            print("'{}': true,".format(filename))
   print('finished check')






