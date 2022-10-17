import 'nprogress/nprogress.css';
import NProgress from 'nprogress';
import axios from 'axios';

const calculatePercentage = (loaded, total) => (Math.floor(loaded * 1.0) / total);

export function loadProgressBar(config, instance = axios) {
  let requestsCounter = 0;

  const setupStartProgress = () => {
    instance.interceptors.request.use((config) => {
      requestsCounter++;

      if (config && config.progress === false) {
        config.onDownloadProgress = null;
        config.onUploadProgress = null;
      } else {
        NProgress.start();
      }

      return config;
    })
  }

  const setupUpdateProgress = () => {
    const update = (event) => NProgress.inc(calculatePercentage(event.loaded, event.total));
    instance.defaults.onDownloadProgress = update;
    instance.defaults.onUploadProgress = update;
  }

  const setupStopProgress = () => {
    const responseFunc = (response) => {
      --requestsCounter;
      if (requestsCounter < 0)
        requestsCounter = 0;

      let progress = (response && response.config && response.config.progress);
      if (progress !== false && requestsCounter <= 0) {
        NProgress.inc(0.0);
        NProgress.done();
      }

      return response;
    }

    const errorFunc = (error) => {
      --requestsCounter;
      if (requestsCounter < 0)
        requestsCounter = 0;

      let progress = (error && error.config && error.config.progress);
      if (requestsCounter <= 0 && progress !== false) {
        NProgress.inc(0.0);
        NProgress.done();
      }

      return Promise.reject(error)
    }

    instance.interceptors.response.use(responseFunc, errorFunc);
  }

  NProgress.configure(config);
  setupStartProgress();
  setupUpdateProgress();
  setupStopProgress();
}
