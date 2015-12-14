# devops-visualizations

Contains toys to visualize certain typical but very unhealthy patterns that a devops engineer might need to know about

## proxy-retry.html

A proxy should never retry. [This explains why](http://artiverse.net/?p=466). This is a standalone HTML/JS file. You can try it [here](http://frumpel.github.io/devops-visualizations/proxy-retry.html) or download it and run it in any JS enabled web browser. It takes three parameters:

* tmin - the minimum time at which your backend is likely to respond
* tmax - the maximum time at which your backend is likely to respond
* tret - the time at which the proxy retries 

This sim doesn't actually consider the possibility of a failure in the backend. Instead it is trying to highlight why it should always be the client and not the proxy that handles the failure by demonstrating how bad the performance implications of a retrying proxy are. 

## backend-waste.html

Retries have some very high costs associated with them. [A writeup for perfect systems is here](http://artiverse.net/?p=481). This is standalone HTML/JS. You can try it [here](http://frumpel.github.io/devops-visualizations/backend-waste.html) or download it and run it in any JS enabled web browser. It takes two parameters:

* speed - default 1000 - this has almost no effect but you can pick smaller numbers if you want to get the simulation to run a little faster
* overload - default 1.07 the factor by which load will exceed speed

This sim is rather artificial because it assumes that response time is perfectly constant and that requests will never be dropped.

