import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  // 注意：不要添加 catch-all 路由，让静态文件请求能够正常处理
  // /uploads/、/api/ 和 /assets/ 路径应该由服务器或 Vercel 处理，不会被 Angular Router 拦截
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

