// BACKEND -> components/json-textarea.edit.js

import React from 'react';
import { TextArea, Label } from '@adminjs/design-system';

// Helper function (wahi jo server.js mein banaya)
const formatObjectToString = (obj) => {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
        return '';
    }
    return Object.entries(obj)
        .map(([key, value]) => `${key} : ${value}`)
        .join('\n');
};

const EditJSONTextarea = (props) => {
    const { property, record, onChange } = props;

    // Record se initial value lo (jo ki ek object hai)
    const initialValue = record.params[property.name] || {};
    
    // Us object ko string me convert karke textarea me dikhao
    const [value, setValue] = React.useState(formatObjectToString(initialValue));

    const handleChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);
        // Parent form ko update kardo
        onChange(property.name, newValue);
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <Label htmlFor={property.name}>{property.label}</Label>
            <TextArea
                id={property.name}
                value={value}
                onChange={handleChange}
                rows={6} // Textarea ka size
            />
        </div>
    );
};

export default EditJSONTextarea;