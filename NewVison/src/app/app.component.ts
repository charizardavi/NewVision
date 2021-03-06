import { Component, OnInit } from '@angular/core';

//import COCO-SSD model as cocoSSD
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { ObjectDetection } from '@tensorflow-models/coco-ssd';
import Speech from 'speak-tts';
import { Plugins } from '@capacitor/core';
const speech = new Speech() // will throw an exception if not browser supported

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'TF-ObjectDetection';
  private video: HTMLVideoElement;
  cwidth: number;
  cheight: number;
  model: ObjectDetection;

  constructor() { }

  ngOnInit() {
    this.cwidth = screen.width;
    this.cheight = screen.height;
    this.webcam_init();
    this.predictWithCocoModel();
    speech.init({
      'volume': 1,
      'lang': 'en-US',
      'rate': 1,
      'pitch': 1,
      'splitSentences': true,
      'listeners': {
        'onvoiceschanged': (voices) => {
          console.log("Event voiceschanged", voices)
        }
      }
    });
  }

  public async predictWithCocoModel() {
    this.model = await cocoSSD.load('lite_mobilenet_v2');
    this.detectFrame(this.video, this.model);
    console.log('model loaded');
  }

  webcam_init() {
    this.video = <HTMLVideoElement>document.getElementById("vid");

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          width: this.cwidth,
          height: this.cheight,
          facingMode: "environment"
        }

      })
      .then(stream => {
        this.video.srcObject = stream;
        this.video.onloadedmetadata = () => {
          this.video.play();
        };
      });
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  }

  renderPredictions = predictions => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");

    const ctx = canvas.getContext("2d");

    canvas.width = this.cwidth;
    canvas.height = this.cheight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    ctx.drawImage(this.video, 0, 0, this.cwidth, this.cheight);

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  };

  tts() {
    let finalstring: string = '';
    this.model.detect(this.video).then(predictions => {
      finalstring = 'I see a ' + predictions.map(p => p.class).join(' and a ');
      console.log(finalstring);
      speech.speak({ text: finalstring });
    });
  }
}
