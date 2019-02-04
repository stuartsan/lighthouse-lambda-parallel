#!/usr/local/bin/node

// do whatever you want here! crawl your site and return a list of its urls
const urls = [
  'https://kubernetesfordogs.com',
];


const podTemplate = (n) => `
---
apiVersion: v1
kind: Pod
metadata:
  name: lh-${n}
  labels:
    lh: yeah
spec:
  # our pod both tolerates and REQUIRES the special LH nodes
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "lighthouse"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: dedicated
            operator: In
            values:
            - lighthouse
  containers:
    - name: lh
      image: kporras07/lighthouse-ci
      resources:
        requests:
          memory: "1Gi"
      args:
      - https://kubernetesfordogs.com
`
const podsYaml = new Array(70).fill('hi').reduce((acc, _, idx) => {
  return acc + podTemplate(idx);
}, '');

console.log(podsYaml);
