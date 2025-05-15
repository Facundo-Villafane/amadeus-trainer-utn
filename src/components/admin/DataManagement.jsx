// src/components/admin/DataManagement.jsx
import { useState } from 'react';
import { Tab } from '@headlessui/react';
import AirlinesManager from './dataManagement/AirlinesManager';
import CitiesManager from './dataManagement/CitiesManager';
import AirportsManager from './dataManagement/AirportsManager';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import { SlPlane } from "react-icons/sl";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DataManagement() {
  const categories = [
    { name: 'Aerolíneas', icon: SlPlane, component: AirlinesManager },
    { name: 'Ciudades', icon: FiMapPin, component: CitiesManager },
    { name: 'Aeropuertos', icon: FiNavigation, component: AirportsManager },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gestión de Datos Maestros</h2>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {categories.map((category) => (
            <Tab
              key={category.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'flex items-center justify-center',
                  selected
                    ? 'bg-amadeus-primary text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                )
              }
            >
              <category.icon className="mr-2" />
              {category.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {categories.map((category, idx) => (
            <Tab.Panel key={idx}>
              <category.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}