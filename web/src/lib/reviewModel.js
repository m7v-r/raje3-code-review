import sample from '../data/mock.json';

export const reviewSample = sample;
export const screenNames = ['بدء مراجعة', 'فحص النطاق', 'تقرير النتائج'];
export const statusClass = status => status === 'needs_review' ? 'warning'
  : status === 'appears_met' ? 'success' : 'unknown';
export const statusIcon = status => status === 'needs_review' ? 'warning'
  : status === 'appears_met' ? 'check' : 'unknown';

export function createDemoDraft() {
  return {
    name: sample.review.name,
    requirements: sample.review.inputRequirements.join('\n'),
    files: sample.review.selectedFiles.map(name => ({ name, demo: true })),
  };
}

export function requirementLines(draft) {
  return draft.requirements.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

export function isDemoDraft(draft) {
  return draft.files.length === sample.review.selectedFiles.length
    && draft.files.every(file => file.demo)
    && draft.files.map(file => file.name).sort().join('|') === sample.review.selectedFiles.slice().sort().join('|')
    && JSON.stringify(requirementLines(draft)) === JSON.stringify(sample.review.inputRequirements);
}

export function visibleResults(filter, file) {
  let rows = sample.review.results.filter(result => !file || result.evidence?.file === file);
  if (filter === 'attention') {
    rows = rows.filter(result => result.status !== 'appears_met')
      .sort((a, b) => Number(a.status === 'unverifiable') - Number(b.status === 'unverifiable'));
  } else if (filter !== 'all') rows = rows.filter(result => result.status === filter);
  return rows;
}
