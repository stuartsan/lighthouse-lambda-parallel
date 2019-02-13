import os
import json
from collections import defaultdict
import statistics
import seaborn as sns

reports_dir = './reports/jobs'

# these are each a group of 1k runs
jobs_by_mem = {
    '1024': [
        'b726d070-2eea-11e9-93fa-83ad58f9aab8',
        '0263d4c0-2eeb-11e9-93fa-83ad58f9aab8',
        '20ad6ea0-2eeb-11e9-9c28-435912cf1e71',
        '36e6d300-2eeb-11e9-9c28-435912cf1e71',
        '4fb05820-2eeb-11e9-93fa-83ad58f9aab8'
    ],
    '1536': [
        '975800b0-2eeb-11e9-93fa-83ad58f9aab8',
        'ffcb0c00-2eeb-11e9-93fa-83ad58f9aab8',
        '422b6310-2eec-11e9-85bc-a3b1f2793aa3',
        '65dde030-2eec-11e9-93fa-83ad58f9aab8',
        '80fd1520-2eec-11e9-93fa-83ad58f9aab8',
    ],
    '768': [
        '14fb6f60-2eed-11e9-93fa-83ad58f9aab8',
        '329eb720-2eed-11e9-93fa-83ad58f9aab8',
        'af8bc390-2eed-11e9-93fa-83ad58f9aab8',
        'fb016410-2eed-11e9-9c28-435912cf1e71',
        '298e8150-2eee-11e9-93fa-83ad58f9aab8',
    ]
}

scores_by_mem = defaultdict(list)

for memory, jobs in jobs_by_mem.items():
    for job_id in jobs:
        job_dir = os.path.join(reports_dir, job_id, 'runs')

        if not os.path.exists(job_dir):
            print(f'Directory not found for job {job_id}; skipping')
            continue

        print(f'Directory found for job {job_id}')

        reports = [f for f in os.listdir(job_dir)]

        for report in reports:
            with open(os.path.join(job_dir, report)) as f:
                r = json.load(f)
                scores_by_mem[memory].append(r['categories']['performance']['score'] * 100)


print(scores_by_mem.keys())

for memory in scores_by_mem.keys():
    scores = scores_by_mem[memory]

    print('memory:', memory)
    print('median:', statistics.median(scores))
    print('mean:', statistics.mean(scores))
    print('std dev:', statistics.stdev(scores))
    print('min:', min(scores))
    print('max:', max(scores))

    sns.set(color_codes=True)
    x = sns.distplot(scores, kde=False, bins=30)
    fig = x.get_figure()
    fig.savefig(f'output-{memory}.png')
