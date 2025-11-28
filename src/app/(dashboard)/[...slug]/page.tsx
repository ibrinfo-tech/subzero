// Universal dynamic module routes handler

import { notFound } from 'next/navigation';
import { moduleRegistry } from '@/core/config/moduleRegistry';
import { getModuleRoutePath } from '@/core/lib/moduleLoader';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import React from 'react';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DynamicModulePage({ params }: PageProps) {
  const { slug } = await params;
  const routePath = '/' + slug.join('/');

  // Get all registered routes
  const allRoutes = moduleRegistry.getAllRoutes();

  // Find matching route
  const matchedRoute = allRoutes.find(({ route }) => {
    // Exact match
    if (route.path === routePath) return true;
    
    // Pattern match (e.g., /notes/:id)
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(routePath);
  });

  if (!matchedRoute) {
    notFound();
  }

  const { moduleId, route } = matchedRoute;

  // Check if module is enabled
  const module = moduleRegistry.getModule(moduleId);
  if (!module || module.config.enabled === false) {
    notFound();
  }

  // Get the component path
  const componentPath = getModuleRoutePath(moduleId, route.component);
  if (!componentPath || !existsSync(componentPath)) {
    console.error(`Component not found: ${componentPath} for route ${route.path}`);
    notFound();
  }

  try {
    // Dynamically import the component
    // Next.js app router supports dynamic imports with proper path resolution
    const modulePath = `@/modules/${moduleId}/routes/${route.component}`;
    
    // Use dynamic import with error handling
    let ComponentModule;
    try {
      ComponentModule = await import(modulePath);
    } catch (importError) {
      console.error(`Failed to import module at ${modulePath}:`, importError);
      notFound();
    }

    const Component = ComponentModule.default;

    if (!Component) {
      console.error(`No default export found in ${modulePath}`);
      notFound();
    }

    return <Component />;
  } catch (error) {
    console.error(`Failed to load component for route ${route.path}:`, error);
    notFound();
  }
}
