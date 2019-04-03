"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let len = (x,y) => Math.sqrt(x*x + y*y);

export class Recognizer{
    constructor(x,y){
        this.previousX = this.startX = x;
        this.previousY = this.startY = y;
        this.previousT = this.startT = Date.now();
        this.odometer = 0;
    }
    isFastNow(threshold = Recognizer.slow_fast_threshold){
        return this.dl/this.dt > threshold;
    }
    isTap(threshold = Recognizer.tap_threshold){
        return this.DeltaL < threshold;
    }
    isDirection(angle, a_threshold = Recognizer.angular_threshold, threshold = Recognizer.tap_threshold){
        while(angle>Math.PI) angle -= Math.PI;
        while(angle<-Math.PI) angle += Math.PI;
        let da = this.angle - angle;
        if(this.DeltaL < threshold) return true;
        else{
            return Math.abs(da)<a_threshold;
        }
    }
    isDirectionD(angle, a_threshold = Recognizer.angular_threshold * 180 / Math.PI, threshold = Recognizer.tap_threshold){
        return this.isDirection(angle*Math.PI/180, a_threshold*Math.PI/180, threshold);
    }
    next(x,y){
        let T = Date.now();
        this.dx = x - this.previousX;
        this.dy = y - this.previousY;
        this.dt = T - this.previousT;

        this.DeltaX = x - this.startX;
        this.DeltaY = y - this.startY;
        this.DeltaT = T - this.startT;

        this.dl = len(this.dx, this.dy);
        this.DeltaL = len(this.DeltaX, this.DeltaY);
        this.angle = Math.atan2(-this.DeltaY, this.DeltaX);

        this.odometer = this.odometer += this.dl;

        this.previousX = x;
        this.previousY = y;
        this.previousT = T;
    }
}

Recognizer.slow_fast_threshold = 0.01;
Recognizer.tap_threshold = 8;
Recognizer.angular_threshold = 0.2;//rad

export class SmoothRecognizer extends Recognizer{
    constructor(x,y,smoothness=2){
        super(x,y);
        this.smoothness = smoothness;
        this.dx_s = [];
        this.dy_s = [];
        this.dt_s = [];
        this.dl_s = [];

        this.dx_smooth = 0;
        this.dy_smooth = 0;
        this.dt_smooth = 0;
        this.dl_smooth = 0;
    }
    isFastNowAv(threshold = Recognizer.slow_fast_threshold){
        return this.dl_smooth/this.dt_smooth > threshold;
    }
    isMature(){
        return this.dl_s.length === this.smoothness;
    }
    next(x,y){
        super.next(x,y);

        this.dx_s.push(this.dx);
        this.dy_s.push(this.dy);
        this.dt_s.push(this.dt);
        this.dl_s.push(this.dl);

        this.dx_smooth += this.dx;
        this.dy_smooth += this.dy;
        this.dt_smooth += this.dt;
        this.dl_smooth += this.dl;

        while(this.dl_s.length > this.smoothness){
            this.dx_smooth -= this.dx_s.shift();
            this.dy_smooth -= this.dy_s.shift();
            this.dt_smooth -= this.dt_s.shift();
            this.dl_smooth -= this.dl_s.shift();
        }
    }
}
