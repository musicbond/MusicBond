import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';


@Injectable()

export class YoutubeService {
     googleToken = "AIzaSyDJx5wHB2nFLJgsVqXVB0U7bAHkDy1uCts";
     maxResults = 10;
     url = 'https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=';
     constructor(public http: Http) {}
     public getVideos(query:any){
        return this.http.get(this.url+query+'&type=video&order=viewCount&maxResults='+this.maxResults+'&key='+this.googleToken)
         .map(res => res.json());
     }
}
