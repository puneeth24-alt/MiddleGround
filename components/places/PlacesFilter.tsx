"use client";

import { Coffee, Utensils, Wine } from "lucide-react";
import { Button } from "@/components/ui/Button";

const OPTIONS = [
  { value: "catering.cafe", label: "Cafes", icon: Coffee },
  { value: "catering.restaurant", label: "Restaurants", icon: Utensils },
  { value: "catering.pub", label: "Pubs", icon: Wine }
];

export function PlacesFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value.includes(option.value);

        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={active ? "primary" : "secondary"}
            onClick={() => {
              const next = active ? value.filter((item) => item !== option.value) : [...value, option.value];
              onChange(next.length > 0 ? next : [option.value]);
            }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
