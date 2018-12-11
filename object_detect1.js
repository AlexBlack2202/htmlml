var netDet = undefined,
    netRecogn = undefined;
var persons = {};
var isRunning = false;
  var cap;
  var frame;
  var frameBGR ;
  var frameHSV ;

const FPS = 30; // Target number of frames processed per second.
//! [Run face detection model]
function detectFaces(frameHSV) {
   let  faces =[];
    //# define range of blue color in HSV
  //  lower_blue = np.array([110,50,50])
  //  upper_blue = np.array([130,255,255])
    let low = new cv.Mat(frameHSV.rows, frameHSV.cols, frameHSV.type(), [110,50,50,0]);
let high = new cv.Mat(frameHSV.rows, frameHSV.cols, frameHSV.type(), [130,255,255,0]);
    //# Threshold the HSV image to get only blue colors
    let mask = new cv.Mat();
    // You can try more different parameters
    cv.inRange(frameHSV, low, high, mask);
let res = new cv.Mat();
    cv.bitwise_and(frameHSV, frameHSV, res, mask);

//     let anchor = new cv.Point(5, 5);
// // You can try more different parameters
// cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());



let gray =new cv.Mat();
cv.cvtColor(res, gray, cv.COLOR_RGBA2GRAY, 0);

console.log('cvt color2');

let thresh =new cv.Mat();
cv.threshold(gray, thresh, 3, 255, cv.THRESH_BINARY);
let contours = new cv.MatVector();
let hierarchy = new cv.Mat();
// You can try more different parameters
cv.findContours(thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
// draw contours with random Scalar
console.log(contours.size());


for (let i = 0; i < contours.size(); i++) {

    let cnt = contours.get(0);
  
    let area = cv.contourArea(cnt, false);
    let rect = cv.boundingRect(cnt);

    if(area<50) continue;

    if (rect.width<rect.height*1.3) continue;

    faces.push([rect.x,rect.y,rect.width,rect.height]);
}
gray.delete();
thresh.delete();
// src.delete(); 
// dst.delete();
 contours.delete(); hierarchy.delete();
mask.delete();
res.delete();
    return faces;
}

function face2vec(face) {
    var blob = cv.blobFromImage(face, 1.0 / 255, {
        width: 96,
        height: 96
    }, [0, 0, 0, 0], true, false)
    netRecogn.setInput(blob);
    var vec = netRecogn.forward();
    blob.delete();
    return vec;
};

function recognize(face) {
    var vec = face2vec(face);
    var bestMatchName = 'unknown';
    var bestMatchScore = 0.5;
    for (name in persons) {
        var personVec = persons[name];
        var score = vec.dot(personVec);
        if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatchName = name;
        }
    }
    vec.delete();
    return bestMatchName;
};

function main() {
 
document.getElementById('abcbutton').onclick = function toggle() {
    console.log('click capture ');
    captureFrame();
};
};



function captureFrame() {
    
    frame = cv.imread('canvasInput');
    frameHSV = new Mat();
    cv.cvtColor(frame,frameHSV,cv.COLOR_RGB2HSV);

    console.log('cvt color1 ');
    var faces = detectFaces(frameHSV);
    faces.forEach(function(rect) {
      cv.rectangle(frame, {x: rect[0], y: rect[1]}, {x: rect[0]+rect[2], y: rect[1] + rect[3]}, [0, 255, 0, 255]);
    //   var face = frameBGR.roi(rect);
    //   var name = recognize(face);
     
    });
    cv.putText(frame, "Nu: "+faces.length+" time: "+begin , {x:20, y: 20}, cv.FONT_HERSHEY_SIMPLEX, 1.0, [0, 255, 0, 255]);
    cv.imshow(output, frame);
    // Loop this function.
   
};

