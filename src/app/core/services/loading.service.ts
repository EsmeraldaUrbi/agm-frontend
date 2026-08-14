import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = signal<number>(0);
  isLoading = signal<boolean>(false);

  show() {
    this.activeRequests.update(count => count + 1);
    this.isLoading.set(true);
  }

  hide() {
    this.activeRequests.update(count => {
      const nextCount = Math.max(0, count - 1);
      if (nextCount === 0) {
        this.isLoading.set(false);
      }
      return nextCount;
    });
  }
}
