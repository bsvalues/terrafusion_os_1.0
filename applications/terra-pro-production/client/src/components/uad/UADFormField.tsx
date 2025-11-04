import React from "react";
import { UADField, UADFieldType } from "./constants";
import { useUADForm } from "@/contexts/UADFormContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface UADFormFieldProps {
  field: UADField;
  className?: string;
}

export const UADFormField: React.FC<UADFormFieldProps> = ({ field, className }) => {
  const { formData, updateField } = useUADForm();

  const value = formData[field.id] ?? field.defaultValue ?? "";

  const handleChange = (newValue: any) => {
    updateField(field.id, newValue);
  };

  // Format currency values for display
  const formatCurrency = (value: any) => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  // Render the field based on its type
  const renderField = () => {
    switch (field.type) {
      case UADFieldType.TEXT:
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
            required={field.required}
          />
        );

      case UADFieldType.NUMBER:
        return (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value) || "")}
            placeholder={field.placeholder}
            className="w-full"
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case UADFieldType.DATE:
        return (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            required={field.required}
          />
        );

      case UADFieldType.CHECKBOX:
        return <Checkbox id={field.id} checked={value} onCheckedChange={handleChange} />;

      case UADFieldType.RADIO:
        return (
          <RadioGroup value={value} onValueChange={handleChange}>
            <div className="flex flex-col space-y-2">
              {(field.options as string[]).map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case UADFieldType.SELECT:
        return (
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="w-full"><>

              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent
</>>
              {Array.isArray(field.options) &&
                field.options.map((option) => {
                  // Handle both string options and object options
                  const optionValue = typeof option === "string" ? option : option.value;
                  const optionLabel = typeof option === "string" ? option : option.label;

                  return (
                    <SelectItem key={optionValue} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        );

      case UADFieldType.TEXTAREA:
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
            required={field.required}
          />
        );

      case UADFieldType.CURRENCY:
        return (
          <div className="relative"><>

            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
</>
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleChange(parseFloat(e.target.value) || "")}
              className="w-full pl-7"
              required={field.required}
              placeholder="0"
              min={0}
            />
          </div>
        );

      case UADFieldType.MEASUREMENT:
        return (
          <div className="relative">
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleChange(parseFloat(e.target.value) || "")}
              className="w-full pr-14"
              required={field.required}
              placeholder="0"
              min={0}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {field.unitType}
            </span>
          </div>
        );

      default:
        return <Input id={field.id} value={value} onChange={(e) => handleChange(e.target.value)} />;
    }
  };

  // Display for fields when viewing
  const renderDisplayValue = () => {
    if (value === null || value === undefined || value === "") return "N/A";

    switch (field.type) {
      case UADFieldType.CURRENCY:
        return formatCurrency(value);

      case UADFieldType.MEASUREMENT:
        return `${value} ${field.unitType}`;

      case UADFieldType.SELECT:
        if (Array.isArray(field.options)) {
          const option = field.options.find((opt) => {
            if (typeof opt === "string") return opt === value;
            return opt.value === value;
          });

          if (option) {
            return typeof option === "string" ? option : option.label;
          }
        }
        return value;

      default:
        return value;
    }
  };

  return (
    <div className={cn("mb-4", className)}>
      <FormItem>
        <div className="flex flex-col">
          <FormLabel htmlFor={field.id} className="mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>

          <FormControl>{renderField()}</FormControl>

          {field.description && <FormDescription>{field.description}</FormDescription>}
        </div>
      </FormItem>
    </div>
  );
};
