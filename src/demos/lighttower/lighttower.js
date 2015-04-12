(function(){
    // 720x1280
    var $canvas, ctx, totalWidth, totalHeight;
    var config = {
        op: {x: 200, y: 500}, // 光源位置
        bgColor: "black",
        colorRGB: "255,0,0", // 光源颜色rgb
        range: 1200, // 光完全消散的距离
        angle: Math.PI / 36, // 光束扩散角（弧度）
        rotateSpeed: Math.PI / 180, // 光源自转速度（弧度/帧）。水平。
        cameraDistance: 300 // 摄像机距离光源位置（即人眼位置）
    };
    var R = Math.PI * 5/4; // 当前弧度（灯光朝向）。纸面内X轴正方向为0.

    var PI = Math.PI,
        sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        arcsin = Math.asin,
        arccos = Math.acos,
        arctan = Math.atan;

    var omegaW = PI/60, omegaH, widthLeft, widthRight, range, dist;
    var theta1, theta2, theta3, theta4, theta5;
    var dataSet = {};


    setTimeout(init, 500);

    function init(){
        $canvas = document.getElementById("canvas");
        ctx = $canvas.getContext("2d");
        totalWidth = parseInt($canvas.width);
        totalHeight = parseInt($canvas.height);
        doMath();
        drawFrame();
    }

    window.updateConfig = function(newConfig){
        for (key in newConfig) {
            if (newConfig.hasOwnProperty(key) && config.hasOwnProperty(key)) {
                config[key] = newConfig[key];
            }
        }
        doMath();
    };

    function drawFrame(){
        painter.clear();
        dispatchMovement(R);
        R += config.rotateSpeed;
        requestAnimationFrame(drawFrame);
        if (R >= PI*2) {
            R -= PI*2;
        }
    }

    function doMath(){
        range = config.range;
        dist = config.cameraDistance;
        widthLeft = config.op.x;
        widthRight = totalWidth - config.op.x;
        omegaH = config.angle;
        dataSet = {};

        // calculation:
        theta1 = PI/2 - omegaW/2;
        theta2 = PI/2 + omegaW/2;
        theta3 = PI;
        theta4 = PI * 3/2 - arctan(widthLeft / dist) - arcsin(sin(arctan(widthLeft / dist)) * dist / range);
        theta5 = 3 * PI/2 + arctan(widthRight / dist) + arcsin(sin(arctan(widthRight / dist)) * dist / range);
    }

    function dispatchMovement(R) {
        painter.fillArc("white", config.op, 5);
        while (R > 2*PI) R -= 2*PI;
        switch (true) {
            case R < theta1:
                moveInPhase1(R);
                break;
            case R <= theta2:
                moveInPhase2(R);
                break;
            case R < theta3:
                moveInPhase3(R);
                break;
            case R < theta4:
                moveInPhase4(R);
                break;
            case R <= theta5:
                moveInPhase5(R);
                break;
            default: // theta5 -> 2PI
                moveInPhase6(R);
                break;
        }
    }


    function moveInPhase1(R){
        if (typeof dataSet[1] == "undefined") {
            dataSet[1] = {};
            dataSet[1].a_OW2D = arctan(dist / widthRight);
            dataSet[1].factor = widthRight * tan(omegaH / 2) * sin(dataSet[1].a_OW2D) * Math.sqrt(Math.pow(dist, 2) + Math.pow(widthRight, 2));
        }
        var visualHeight = dataSet[1].factor * sin(R +  dataSet[1].a_OW2D);
        visualHeight /= (dist * sin(PI/2 - R) * sin(PI - R -  dataSet[1].a_OW2D));

        var color = calcColor(R, totalWidth);
        var points = [
            config.op,
            {x: totalWidth, y: config.op.y + visualHeight},
            {x: totalWidth, y: config.op.y - visualHeight}
        ];
        painter.fillTriangle(color, points);
    }

    // 光晃眼球
    function moveInPhase2(){
        // 画覆盖全屏的巨型
        painter.fillRect("rgba(" + config.colorRGB + ", 0.7)", {x: 0, y: 0}, totalWidth, totalHeight);
    }

    function moveInPhase3(R){
        if (typeof dataSet[3] == "undefined") {
            dataSet[3] = {};
            dataSet[3].a_OW1D = arctan(dist/widthLeft);
            dataSet[3].factor = widthLeft * tan(omegaH/2) * sin(dataSet[3].a_OW1D) * Math.sqrt(Math.pow(dist, 2) + Math.pow(widthLeft, 2));
        }
        var visualHeight = dataSet[3].factor * sin(R +  dataSet[3].a_OW1D);
        visualHeight /= (dist * sin(PI/2 - R) * sin(PI - R -  dataSet[3].a_OW1D));

        var color = calcColor(R, 0);
        var points = [
            config.op,
            {x: 0, y: config.op.y + visualHeight},
            {x: 0, y: config.op.y - visualHeight}
        ];
        painter.fillTriangle(color, points);
    }

    function moveInPhase4(R){
        if (typeof dataSet[4] == "undefined") {
            dataSet[4] = {};
            dataSet[4].a_ODW1 = arctan(widthLeft/dist);
            dataSet[4].factor = tan(omegaH/2) * sin(dataSet[4].a_ODW1) * Math.sqrt(Math.pow(dist, 2) + Math.pow(widthLeft, 2));
        }
        var visualHeight = dataSet[4].factor / sin(R - PI/2);

        var color = calcColor(R, 0);
        var points = [
            config.op,
            {x: 0, y: config.op.y + visualHeight},
            {x: 0, y: config.op.y - visualHeight}
        ];
        painter.fillTriangle(color, points);
    }
    function moveInPhase5(R){
        if (typeof dataSet[5] == "undefined") {
            dataSet[5] = {};
            dataSet[5].factor = range * tan(omegaH/2) * dist
        }
        var visualHeight = dataSet[5].factor / (dist - range * sin(R));
        var visualWidth = dist * range * cos(R) / (range * sin(R) - dist);

        var color = calcColor(R, config.op.x - visualWidth);
        var points = [
            config.op,
            {x: config.op.x - visualWidth, y: config.op.y + visualHeight},
            {x: config.op.x - visualWidth, y: config.op.y - visualHeight}
        ];
        painter.fillTriangle(color, points);
    }
    function moveInPhase6(R){
        if (typeof dataSet[6] == "undefined") {
            dataSet[6] = {};
            dataSet[6].a_ODW2 = arctan(widthRight/dist);
            dataSet[6].factor = tan(omegaH/2) * sin(dataSet[6].a_ODW2) * Math.sqrt(Math.pow(dist, 2) + Math.pow(widthRight, 2));
        }
        var visualHeight = dataSet[6].factor / sin(PI * 5/2 - R);

        var color = calcColor(R, totalWidth);
        var points = [
            config.op,
            {x: totalWidth, y: config.op.y + visualHeight},
            {x: totalWidth, y: config.op.y - visualHeight}
        ];
        painter.fillTriangle(color, points);
    }

    function calcColor(R, endPointX){
        var lineGradient = ctx.createLinearGradient (config.op.x, config.op.y, endPointX, config.op.y);
        var start = 0.5 + (1/2 * sin(R) - 1/2 * cos(R * 2)) * 0.5;
        var end = 0.05;
        lineGradient.addColorStop(0, "rgba(" + config.colorRGB + ", " + start + ")");
        lineGradient.addColorStop(1, "rgba(" + config.colorRGB + ", " + end + ")");
        return lineGradient;
    }

    var painter = {
        fillArc: function(color, point, radius){
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        },
        fillTriangle: function(color, points){
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.closePath();
            ctx.fill();
        },
        fillRect: function(color, point, width, height){
            ctx.fillStyle = color;
            //console.debug("Fill rect("+point.x+","+point.y+") with color " + color);
            ctx.fillRect(point.x, point.y, width, height);
        },
        clear: function(){
            ctx.fillStyle = config.bgColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
        }
    }

}());







