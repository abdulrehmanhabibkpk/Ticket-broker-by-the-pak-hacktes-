import React from 'react';
import { Input } from './UIComponents';

interface PassengerDetailsFormProps {
  details: any;
  setDetails: (details: any) => void;
  disabled?: boolean;
}

export const PassengerDetailsForm: React.FC<PassengerDetailsFormProps> = ({ details, setDetails, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Title"
        name="title"
        id="title"
        value={details.title || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="First Name"
        name="firstName"
        id="firstName"
        value={details.firstName || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Last Name"
        name="lastName"
        id="lastName"
        value={details.lastName || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Gender"
        name="gender"
        id="gender"
        value={details.gender || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Nationality"
        name="nationality"
        id="nationality"
        value={details.nationality || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Date of Birth"
        name="dob"
        id="dob"
        type="date"
        value={details.dob || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Passport/NIC No."
        name="passportNo"
        id="passportNo"
        value={details.passportNo || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Document Expiry"
        name="documentExpiry"
        id="documentExpiry"
        type="date"
        value={details.documentExpiry || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Frequent Flyer"
        name="frequentFlyer"
        id="frequentFlyer"
        value={details.frequentFlyer || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Wheelchair"
        name="wheelchair"
        id="wheelchair"
        value={details.wheelchair || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Meal"
        name="meal"
        id="meal"
        value={details.meal || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Phone"
        name="phone"
        id="phone"
        value={details.phone || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Reference"
        name="reference"
        id="reference"
        value={details.reference || ""}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
};
