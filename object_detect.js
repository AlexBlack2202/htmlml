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
    let low = new cv.Mat(frameHSV.rows, frameHSV.cols, frameHSV.type(), [110,50,50]);
let high = new cv.Mat(frameHSV.rows, frameHSV.cols, frameHSV.type(), [130,255,255]);
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
for (let i = 0; i < contours.size(); ++i) {
    let area = cv.contourArea(contours[i], false);
    let rect = cv.boundingRect(contours[i]);

    if(area<50) continue;

    if (rect.width<rect.height*1.3) continue;

    faces.push([rect.x,rect.y,rect.width,rect.height]);
}
gray.delete();
thresh.delete();
src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
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
    var output = document.getElementById('output');
    var camera = document.createElement("video");
    camera.setAttribute("width", output.width);
    camera.setAttribute("height", output.height);
    const constraints = {
        advanced: [{
            facingMode: "environment"
        }]
    };

    navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    devices.forEach(function(device) {
      console.log(device.kind + ": " + device.label +
        " id = " + device.deviceId);
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + error.message);
  });

    // Get a permission from user to use a camera.
    navigator.mediaDevices.getUserMedia({
            video: constraints,
            audio: false
        })
        .then(function (stream) {
            camera.srcObject = stream;
            camera.onloadedmetadata = function (e) {
                camera.play();
            };
        });
    //! [Open a camera stream]
     cap = new cv.VideoCapture(camera);
     frame = new cv.Mat(camera.height, camera.width, cv.CV_8UC4);
   //  frameBGR = new cv.Mat(camera.height, camera.width, cv.CV_8UC3);
   frameHSV =new cv.Mat();
    //! [Open a camera stream]
    //! [Add a person]

    //! [Add a person]
    //! [Define frames processing]
    
    document.getElementById('startStopButton').onclick = function toggle() {
        if (isRunning) {
            isRunning = false;
            document.getElementById('startStopButton').innerHTML = 'Start';
        } else {
            function run() {
                isRunning = true;
                captureFrame();
                document.getElementById('startStopButton').innerHTML = 'Stop';
                document.getElementById('startStopButton').disabled = false;
            }
            run();
    
        }
    };
    
    //! [Define frames processing]
 
    document.getElementById('startStopButton').disabled = false;
};

function captureFrame() {
    var begin = Date.now();
    cap.read(frame); // Read a frame from camera
    // cv.cvtColor(frame, frameBGR, cv.COLOR_RGBA2BGR);

    cv.cvtColor(frame,frameHSV,cv.COLOR_RGB2HSV);
    console.log('cvt color1');
    var faces = detectFaces(frameHSV);
    faces.forEach(function(rect) {
      cv.rectangle(frame, {x: rect[0], y: rect[1]}, {x: rect[0]+rect[2], y: rect[1] + rect[3]}, [0, 255, 0, 255]);
    //   var face = frameBGR.roi(rect);
    //   var name = recognize(face);
     
    });
    cv.putText(frame, "alex debug", {x:20, y: 20}, cv.FONT_HERSHEY_SIMPLEX, 1.0, [0, 255, 0, 255]);
    cv.imshow(output, frame);
    // Loop this function.
    if (isRunning) {
        var delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(captureFrame, delay);
    }
};

