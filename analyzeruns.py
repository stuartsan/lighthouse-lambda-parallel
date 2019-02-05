import os
import json
from collections import defaultdict
import statistics
import seaborn as sns

reports_dir = './runs'

reports = [f for f in os.listdir(reports_dir)]

scores = []


for report in reports:
    with open(os.path.join(reports_dir, report)) as f:
        r = json.load(f)
        scores.append(r['categories']['performance']['score'] * 100)


print('median:', statistics.median(scores))
print('mean:', statistics.mean(scores))
print('std dev:', statistics.stdev(scores))
print('min:', min(scores))
print('max:', max(scores))

sns.set(color_codes=True)
x = sns.distplot(scores, kde=False, bins=30)
fig = x.get_figure()
fig.savefig('output.png')
