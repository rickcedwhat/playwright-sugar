import type { Dataset } from './App';

interface Props {
  dataset: Dataset | null;
}

export default function DatasetDetailPage({ dataset }: Props) {
  if (!dataset) {
    return <p style={{ color: '#999' }}>Dataset not found.</p>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>{dataset.name}</h1>
      {/*
        "This dataset is empty" is the success outcome locator for the
        Issue #10 create play — it signals that creation succeeded and
        the user landed on the detail page.
      */}
      <p style={{ color: '#666' }}>This dataset is empty</p>
    </div>
  );
}
