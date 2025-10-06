// WebGPU visual core — adaptive micro-fluid + iris + φ-depth DoF
export type Metrics = { cpu: number; net: number; focus: number }; // 0..1 normalized
export class TerraVisualGPU {
  private adapter!: GPUAdapter; private device!: GPUDevice; private ctx!: GPUCanvasContext;
  private format!: GPUTextureFormat; private presentationSize!: [number, number];
  private uniforms!: GPUBuffer; private irisUniforms!: GPUBuffer; private dofUniforms!: GPUBuffer;
  private microfluidPipeline!: GPURenderPipeline; private irisPipeline!: GPURenderPipeline; private dofPipeline!: GPURenderPipeline;
  private sampler!: GPUSampler; private colorTex!: GPUTexture; private colorView!: GPUTextureView;
  metrics: Metrics = { cpu: 0.1, net: 0.1, focus: 0.2 };
  t = 0;

  async init(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) throw new Error('WebGPU not available');
    this.adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }) as GPUAdapter;
    this.device = await this.adapter.requestDevice({});
    this.ctx = canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.ctx.configure({ device: this.device, format: this.format, alphaMode: 'opaque' });

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.presentationSize = [canvas.clientWidth * dpr, canvas.clientHeight * dpr];

    // Render target (for DoF)
    this.colorTex = this.device.createTexture({ size: this.presentationSize, format: this.format, usage:
      GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
    this.colorView = this.colorTex.createView();
    this.sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

    // Uniforms
    this.uniforms = this.device.createBuffer({ size: 12, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); // time, flow, base
    this.irisUniforms = this.device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); // time, open
    this.dofUniforms = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });  // blur px

    // Shaders (inline or import text)
    const microfluid = await (await fetch(new URL('../shaders/microfluid.wgsl', import.meta.url))).text();
    const iris = await (await fetch(new URL('../shaders/iris.wgsl', import.meta.url))).text();
    const dof = await (await fetch(new URL('../shaders/depth_of_field.wgsl', import.meta.url))).text();

    const quad = {
      module: this.device.createShaderModule({ code: `
        @vertex fn vs(@builtin(vertex_index) vi:u32)->@builtin(position) vec4<f32>{
          var pos=array<vec2<f32>,6>(vec2(-1.,-1.),vec2(1.,-1.),vec2(1.,1.),vec2(-1.,-1.),vec2(1.,1.),vec2(-1.,1.));
          return vec4<f32>(pos[vi],0.,1.);
        }` })
    };

    // Microfluid pipeline
    this.microfluidPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: quad,
      fragment: { module: this.device.createShaderModule({ code: microfluid }), entryPoint: 'fs_main', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' }
    });

    // Iris pipeline
    this.irisPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: quad,
      fragment: { module: this.device.createShaderModule({ code: iris }), entryPoint: 'fs_main', targets: [{ format: this.format }] }
    });

    // DoF pipeline (post)
    this.dofPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: quad,
      fragment: { module: this.device.createShaderModule({ code: dof }), entryPoint: 'fs_main', targets: [{ format: this.format }] }
    });
  }

  resize(canvas: HTMLCanvasElement) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.presentationSize = [canvas.clientWidth * dpr, canvas.clientHeight * dpr];
    this.colorTex.destroy();
    this.colorTex = this.device.createTexture({ size: this.presentationSize, format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
    this.colorView = this.colorTex.createView();
  }

  frame(dtMs: number) {
    this.t += dtMs / 1000;
    const encoder = this.device.createCommandEncoder();

    // pass 1: scene into color target (microfluid + iris over it)
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: this.colorView, clearValue: { r:0.043, g:0.063, b:0.125, a:1 }, loadOp:'clear', storeOp:'store' }]
    });

    // Microfluid uniforms: time, flowIntensity (net/cpu avg), baseGlow
    const flow = Math.min(1, (this.metrics.net + this.metrics.cpu) * 0.6 + 0.05);
    this.device.queue.writeBuffer(this.uniforms, 0, new Float32Array([this.t, flow, 0.35]));
    pass.setPipeline(this.microfluidPipeline);
    pass.setBindGroup(0, this.device.createBindGroup({ layout: this.microfluidPipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: this.uniforms } }
    ]}));
    pass.draw(6);

    // Iris uniforms: time, open (focus)
    this.device.queue.writeBuffer(this.irisUniforms, 0, new Float32Array([this.t, this.metrics.focus]));
    pass.setPipeline(this.irisPipeline);
    pass.setBindGroup(0, this.device.createBindGroup({ layout: this.irisPipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: this.irisUniforms } }
    ]}));
    pass.draw(6);

    pass.end();

    // pass 2: DoF to canvas
    const view = this.ctx.getCurrentTexture().createView();
    const pass2 = encoder.beginRenderPass({ colorAttachments: [{ view, loadOp:'clear', storeOp:'store', clearValue: { r:0, g:0, b:0, a:1 } }]});
    // blur grows when focus is high (background recedes)
    const blurPx = (this.metrics.focus > 0.5) ? 40 : 20;
    this.device.queue.writeBuffer(this.dofUniforms, 0, new Float32Array([blurPx]));
    pass2.setPipeline(this.dofPipeline);
    pass2.setBindGroup(0, this.device.createBindGroup({ layout: this.dofPipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: this.dofUniforms } },
      { binding: 1, resource: this.colorView },
      { binding: 2, resource: this.sampler }
    ]}));
    pass2.draw(6);
    pass2.end();

    this.device.queue.submit([encoder.finish()]);
  }
}

