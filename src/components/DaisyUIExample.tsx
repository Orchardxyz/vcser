export function DaisyUIExample() {
  return (
    <div className="panel-surface p-6">
      <h2 className="text-lg font-bold mb-4">daisyUI Components Example</h2>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <button className="btn">Default</button>
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-accent">Accent</button>
        <button className="btn btn-ghost">Ghost</button>
      </div>

      <div className="alert alert-info mb-4">
        <span>daisyUI is now integrated with UnoCSS!</span>
      </div>

      <div className="flex gap-2">
        <span className="badge">Default</span>
        <span className="badge badge-primary">Primary</span>
        <span className="badge badge-secondary">Secondary</span>
        <span className="badge badge-accent">Accent</span>
      </div>
    </div>
  );
}
