// Universal dynamic module routes handler

import { notFound } from 'next/navigation';
import { moduleRegistry } from '@/core/config/moduleRegistry';
import { getModuleRoutePath } from '@/core/lib/moduleLoader';
import { existsSync } from 'fs';
import React from 'react';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

// Module cache to store dynamically imported components
const moduleCache = new Map<string, any>();

/**
 * Dynamically load a module component
 * Uses a mapping approach to load modules available at build time
 */
async function loadModuleComponent(moduleId: string, component: string) {
  const cacheKey = `${moduleId}:${component}`;
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  // Use a mapping of known modules to their imports
  // This approach allows Next.js to bundle all modules at build time
  let ComponentModule;
  
  try {
    switch (moduleId) {
      case 'customers':
        ComponentModule = await import('@/modules/customers/routes/index');
        break;
      case 'leads':
        ComponentModule = await import('@/modules/leads/routes/index');
        break;
      case 'logs':
        ComponentModule = await import('@/modules/logs/routes/index');
        break;
      case 'projects':
        ComponentModule = await import('@/modules/projects/routes/index');
        break;
      case 'tasks':
        ComponentModule = await import('@/modules/tasks/routes/index');
        break;
      default:
        return null;
    }
    
    moduleCache.set(cacheKey, ComponentModule);
    return ComponentModule;
  } catch (error) {
    console.error(`[DynamicRoute] Failed to load module ${moduleId}:`, error);
    return null;
  }
}

export default async function DynamicModulePage({ params }: PageProps) {
  const { slug } = await params;
  const routePath = '/' + slug.join('/');

  // Force re-initialization to ensure routes are loaded
  moduleRegistry.initialize(true);

  // Get all registered routes
  const allRoutes = moduleRegistry.getAllRoutes();
  
  // Debug logging
  console.log(`[DynamicRoute] Looking for route: ${routePath}`);
  console.log(`[DynamicRoute] Available routes:`, allRoutes.map(r => ({ moduleId: r.moduleId, path: r.route.path })));

  // Find matching route
  const matchedRoute = allRoutes.find(({ route }) => {
    // Exact match
    if (route.path === routePath) {
      console.log(`[DynamicRoute] Exact match found: ${route.path}`);
      return true;
    }
    
    // Pattern match (e.g., /notes/:id)
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    const matches = regex.test(routePath);
    if (matches) {
      console.log(`[DynamicRoute] Pattern match found: ${route.path} matches ${routePath}`);
    }
    return matches;
  });

  if (!matchedRoute) {
    console.error(`[DynamicRoute] No route found for: ${routePath}`);
    console.error(`[DynamicRoute] Available routes were:`, allRoutes.map(r => r.route.path));
    notFound();
  }

  const { moduleId, route } = matchedRoute;

  // Check if module is enabled
  const module = moduleRegistry.getModule(moduleId);
  if (!module || module.config.enabled === false) {
    notFound();
  }

  // Get the component path (for verification only)
  const componentPath = getModuleRoutePath(moduleId, route.component);
  if (!componentPath || !existsSync(componentPath)) {
    console.error(`Component not found: ${componentPath} for route ${route.path}`);
    notFound();
  }

  try {
    console.log(`[DynamicRoute] Loading module: ${moduleId}, Component: ${route.component}`);
    
    // Dynamically load the component using the mapping approach
    const ComponentModule = await loadModuleComponent(moduleId, route.component);
    
    if (!ComponentModule) {
      console.error(`[DynamicRoute] Failed to load component for module ${moduleId}`);
      notFound();
    }

    const Component = ComponentModule.default;

    if (!Component) {
      console.error(`[DynamicRoute] No default export found in module ${moduleId}`);
      console.error(`[DynamicRoute] Available exports:`, Object.keys(ComponentModule));
      notFound();
    }

    // Build params object for dynamic segments (e.g., /module/:id)
    const paramsObj: Record<string, string> = {};
    const routeSegments = route.path.split('/').filter(Boolean);
    const pathSegments = routePath.split('/').filter(Boolean);
    routeSegments.forEach((seg: string, idx: number) => {
      if (seg.startsWith(':')) {
        const key = seg.slice(1);
        paramsObj[key] = pathSegments[idx] || '';
      }
    });

    console.log(`[DynamicRoute] Successfully loaded component for ${route.path} with params`, paramsObj);
    return <Component params={paramsObj} />;
  } catch (error) {
    console.error(`[DynamicRoute] Failed to load component for route ${route.path}:`, error);
    notFound();
  }
}
