# devops-visualizations

Contains toys to visualize certain typical but very unhealthy patterns that a defops engineer might need to know about

## proxy-retry.html

A proxy should never retry. This is why. This is a standalone HTML/JS file. Run in any web browser. It takes three parameters:

* tmin - the minimum time at which your backend is likely to respond
* tmax - the maximum time at which your backend is likely to respond
* tret - the time at which the proxy retries 

This sim doesn't actually consider the possibility of a failure in the backend. Instead it is trying to highlight why it should always be the client and not the proxy that handles the failure by demonstrating how bad the performance implications of a retrying proxy are.
