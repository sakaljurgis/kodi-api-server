import {
  Controller,
  Get,
  Next,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

@Controller('*')
export class StaticController {
  @Get()
  async main(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    const relPath = request.url;
    //relPath = relPath.split('%2E').join('.');
    //relPath = relPath.split('%2e').join('.');

    if (relPath.indexOf('..') > -1) {
      throw new UnauthorizedException(
        'You are not authorized to visit ' + request.url,
      );
    }

    const path = join(__dirname, process.env.STATIC_SERVE_FOLDER, relPath);

    const stats: any = await stat(path).catch(() => false);

    if (stats === false) {
      throw new NotFoundException('Path not found: ' + relPath);
    }

    if (stats.isDirectory()) {
      response.status(200).send(await readDirectory(path, relPath));
      //.send(JSON.stringify(await readDirectory(path, relPath), null, ' '));

      return;
    }

    return next();
  }
}

async function readDirectory(path: string, relPath: string) {
  let files = await readdir(path);
  let longestFileLenght = 0;

  files = files.filter((fileName: string) => {
    const fileIncluded = fileName[0] !== '.';
    longestFileLenght = fileIncluded ? fileName.length : longestFileLenght;

    return fileIncluded;
  });

  let result: string;

  if (files.length == 0) {
    //strPath = strPath.replace(strRootDir, "")
    result = "<html>\n"
    result = result + "<head><title>Index of " + relPath + "</title></head>\n"
    result = result + '<body bgcolor="white">\n'
    result = result + '<h1>Index of ' + relPath + '</h1><hr><pre><a href="../">../</a>'
    result = result + "\n</pre><hr></body>"
    result = result + "</html>"
  }

  return result;
}

// function getFilesInDirHtml(strPath, callback) {
//   readdir

//   fs.readdir(strPath, function (err, arrItemsAll) {

//     if (err) { callback(err, null) }

//     var arrItemsNotHidden = []
//     var numLength = 0

//     if (!arrItemsAll) arrItemsAll = []

//     //remove hidden (with dot in front)
//     //find longest item length
//     arrItemsAll.forEach(function (strItem) {

//       if (strItem[0] != ".") {

//         arrItemsNotHidden[arrItemsNotHidden.length] = strItem
//         if (strItem.length > numLength) { numLength = strItem.length }

//       }

//     });

//     numLength = numLength + 10

//     var arrRows = []
//     arrItemsNotHidden.sort()

//     if (arrItemsNotHidden.length == 0) {
//       strPath = strPath.replace(strRootDir, "")
//       var result = "<html>\n"
//       result = result + "<head><title>Index of " + strPath + "</title></head>\n"
//       result = result + '<body bgcolor="white">\n'
//       result = result + '<h1>Index of ' + strPath + '</h1><hr><pre><a href="../">../</a>'
//       result = result + "\n</pre><hr></body>"
//       result = result + "</html>"
//       callback(null, result)
//     }

//     arrItemsNotHidden.forEach(function (strItem) {

//       fs.stat(strPath + strItem, function (err, stats) {

//         if (err) {
//           arrRows[arrRows.length] = "error"
//           return
//         }

//         var strRow = ""
//         var strSize = ""
//         var strDate = ""
//         var strName = ""

//         //get size and name and date
//         if (!stats.isDirectory()) {

//           strSize = stats.size.toString()
//           strSize = space(20 - strSize.length) + strSize

//           //add name
//           strName = strItem
//           //get date
//           var arrDate = stats.birthtime.toUTCString().split(" ")
//           strDate = space(numLength - strItem.length) + arrDate[1] + "-" + arrDate[2] + "-" + arrDate[3] + " " + arrDate[4]
//           //strDate = space(numLength - strItem.length) + stats.birthtime.toISOString()

//         } else {
//           strSize = space(19) + "-"
//           //add name
//           strName = strItem + "/"
//           //get date
//           var arrDate = stats.birthtime.toUTCString().split(" ")
//           strDate = space(numLength - strItem.length - 1) + arrDate[1] + "-" + arrDate[2] + "-" + arrDate[3] + " " + arrDate[4]
//           //strDate = space(numLength - strItem.length - 1) + stats.birthtime.toISOString()
//         }

//         //combine row
//         //<a href="Animation/">Animation/</a>          28-Apr-2018 20:56      				-
//         strRow = '<a href="' + strName + '">' + strName + '</a>' + strDate + strSize

//         //strRow = strName + strDate + strSize
//         arrRows[arrRows.length] = strRow

//         //check if all done, call callback
//         if (arrRows.length == arrItemsNotHidden.length) {
//           //callback(null, result)
//           arrRows.sort()
//           strPath = strPath.replace(strRootDir, "");
//           var result = '<html>\n';
//           result =
//             result + '<head><title>Index of ' + strPath + '</title></head>\n';
//           result = result + '<body bgcolor="white">\n'
//           result =
//             result +
//             '<h1>Index of ' +
//             strPath +
//             '</h1><hr><pre><a href="../">../</a>\n';
//           result = result + arrRows.join('\n');
//           result = result + '\n</pre><hr></body>';
//           result = result + '</html>';
//           callback(null, result);
//         }
//       });
//     });
//   });
// }
