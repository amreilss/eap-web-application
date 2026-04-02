// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SawProductionComponent } from './pages/saw-production/saw-production.component';
import { MachineDetailComponent } from './pages/machine-detail/machine-detail/machine-detail.component';
import { MachineToolingComponent } from './pages/machine-tooling/machine-tooling.component';
import { machineResolver } from './pages/machine-detail/machine.resolver';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'saw', component: SawProductionComponent },
  { path: 'saw/:id', component: MachineDetailComponent, resolve: { machine: machineResolver }, runGuardsAndResolvers: 'paramsChange', },
  { path: 'saw/:id/tooling', component: MachineToolingComponent,},
  { path: 'machine/:id', redirectTo: 'saw/:id', pathMatch: 'full' },
  { path: 'machine/:id/tooling', redirectTo: 'saw/:id/tooling', pathMatch: 'full' },

];