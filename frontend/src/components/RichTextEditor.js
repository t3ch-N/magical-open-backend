import React from 'react';

const RichTextEditor = ({ value, onChange, placeholder = "Write your content...", height = "300px" }) => {
  return (
    <div className="rich-text-editor">
      <div className="toolbar bg-muted p-2 rounded-t-lg border border-b-0 flex gap-1 flex-wrap">
        <button type="button" onClick={() => onChange(value + '\n<h2>Heading</h2>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">H2</button>
        <button type="button" onClick={() => onChange(value + '\n<h3>Subheading</h3>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">H3</button>
        <button type="button" onClick={() => onChange(value + '\n<p><strong>Bold text</strong></p>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 font-bold">B</button>
        <button type="button" onClick={() => onChange(value + '\n<p><em>Italic text</em></p>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 italic">I</button>
        <button type="button" onClick={() => onChange(value + '\n<ul>\n  <li>List item</li>\n</ul>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">List</button>
        <button type="button" onClick={() => onChange(value + '\n<a href="#">Link text</a>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">Link</button>
        <button type="button" onClick={() => onChange(value + '\n<img src="IMAGE_URL" alt="Description" style="max-width:100%;" />')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">Image</button>
        <button type="button" onClick={() => onChange(value + '\n<blockquote>Quote text</blockquote>')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">Quote</button>
        <button type="button" onClick={() => onChange(value + '\n<hr />')} className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50">Line</button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-b-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ minHeight: height }}
      />
      {value && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
          <div 
            className="border rounded-lg p-4 bg-white prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
