const fs = require('fs');
const path = require('path');

const extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
const searchDirs = ['src', 'public'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
            }
        } else {
            arrayOfFiles.push(path.join(dirPath, '/', file));
        }
    });
    return arrayOfFiles;
}

const allFiles = getAllFiles('d:/DUAN/MYLIFE/Frontend-MyLife/src').concat(getAllFiles('d:/DUAN/MYLIFE/Frontend-MyLife/public'));
const images = allFiles.filter(f => extensions.includes(path.extname(f).toLowerCase()));
const codeFiles = allFiles.filter(f => !extensions.includes(path.extname(f).toLowerCase()));

let unusedImages = [];

images.forEach(img => {
    const baseName = path.basename(img);
    let isUsed = false;
    for (let codeFile of codeFiles) {
        const content = fs.readFileSync(codeFile, 'utf8');
        if (content.includes(baseName)) {
            isUsed = true;
            break;
        }
    }
    if (!isUsed) {
        unusedImages.push(img);
    }
});

console.log('UNUSED IMAGES:');
unusedImages.forEach(img => {
    console.log(img);
    // Optionally delete them here, but let's just log first
});
