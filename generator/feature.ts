import fs from "node:fs"
import path from "node:path"

type ParsedArgs = {
  _: string[];
  name?: string;
};

type GeneratedFile = {
  path: string;
  content: string;
};

const args = parseArgs(process.argv.slice(2));
const rawName = (args.name ?? args._[0] ?? '').trim();

if (!rawName) {
  console.error('Please provide a feature name.');
  console.error('Example: npx ts-node generator/feature.ts Users');
  console.error('Example: npx ts-node generator/feature.ts --name RevenueSplits');
  process.exit(1);
}

const featureName = toKebabCase(rawName);
const featurePascal = toPascalCase(rawName);
const featureCamel = toCamelCase(rawName);
const featureTitle = toTitleCase(rawName);

const rootDir = process.cwd();
const moduleDir = path.join(rootDir, 'src', 'modules', featureName);
const dtoDir = path.join(moduleDir, 'dto');
const schemasDir = path.join(moduleDir, 'schemas');

if (fs.existsSync(moduleDir)) {
  console.error(`Feature "${featureName}" already exists at ${moduleDir}`);
  process.exit(1);
}

ensureDir(moduleDir);
ensureDir(dtoDir);
ensureDir(schemasDir);

const files: GeneratedFile[] = [
  {
    path: path.join(schemasDir, `${featureName}.schema.ts`),
    content: generateSchemaFile(featurePascal, featureName),
  },
  {
    path: path.join(dtoDir, `create-${featureName}.dto.ts`),
    content: generateCreateDtoFile(featurePascal),
  },
  {
    path: path.join(dtoDir, `update-${featureName}.dto.ts`),
    content: generateUpdateDtoFile(featurePascal, featureName),
  },
  {
    path: path.join(moduleDir, `${featureName}.service.ts`),
    content: generateServiceFile(featurePascal, featureCamel, featureName, featureTitle),
  },
  {
    path: path.join(moduleDir, `${featureName}.controller.ts`),
    content: generateControllerFile(featurePascal, featureCamel, featureName),
  },
  {
    path: path.join(moduleDir, `${featureName}.module.ts`),
    content: generateModuleFile(featurePascal, featureName),
  },
];

for (const file of files) {
  fs.writeFileSync(file.path, file.content, 'utf8');
  console.log(`  created  ${path.relative(rootDir, file.path)}`);
}

registerModuleImport(rootDir, featurePascal, featureName);

console.log(`\nFeature "${featureName}" generated successfully.`);
console.log(`Next: add your fields to schemas/${featureName}.schema.ts and DTOs.`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--name') {
      parsed.name = argv[i + 1];
      i++;
    } else {
      parsed._.push(argv[i]);
    }
  }
  return parsed;
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toKebabCase(value: string): string {
  return splitWords(value).join('-').toLowerCase();
}

function toPascalCase(value: string): string {
  return splitWords(value)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(value: string): string {
  const p = toPascalCase(value);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function toTitleCase(value: string): string {
  return splitWords(value)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter(Boolean);
}

function registerModuleImport(rootDir: string, featurePascal: string, featureName: string): void {
  const appModulePath = path.join(rootDir, 'src', 'app.module.ts');

  if (!fs.existsSync(appModulePath)) {
    console.warn('\nWarning: src/app.module.ts not found, skipping auto-registration.');
    console.warn(`Manually import ${featurePascal}Module into your AppModule.`);
    return;
  }

  let content = fs.readFileSync(appModulePath, 'utf8');

  // ─── 1. Add ES import line at top ─────────────────────────────────────────
  const importLine = `import { ${featurePascal}Module } from './modules/${featureName}/${featureName}.module';`;
  if (!content.includes(importLine)) {
    const lines = content.split('\n');
    const lastImportIdx = lines.reduce(
      (idx, line, i) => (line.startsWith('import ') ? i : idx),
      -1,
    );
    lines.splice(lastImportIdx + 1, 0, importLine);
    content = lines.join('\n');
  }

  // Already registered in @Module imports?
  if (content.includes(`${featurePascal}Module`)) {
    console.log(`  skipped  ${featurePascal}Module already registered in app.module.ts`);
    fs.writeFileSync(appModulePath, content, 'utf8');
    return;
  }

  // ─── 2. Locate @Module({ decorator ────────────────────────────────────────
  const moduleDecoratorIdx = content.indexOf('@Module({');
  if (moduleDecoratorIdx === -1) {
    console.warn('\nWarning: @Module decorator not found. Add manually.');
    return;
  }

  // ─── 3. Walk chars from @Module to find `imports:` at depth 1 ─────────────
  // depth 1 = directly inside @Module({...}), not nested in forRootAsync etc.
  const afterDecorator = content.slice(moduleDecoratorIdx);
  let depth = 0;
  let importsKeyOffset = -1;

  for (let i = 0; i < afterDecorator.length; i++) {
    const ch = afterDecorator[i];
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    if (ch === '}' || ch === ']' || ch === ')') depth--;

    if (depth === 1 && afterDecorator.slice(i).match(/^imports\s*:/)) {
      importsKeyOffset = i;
      break;
    }
  }

  if (importsKeyOffset === -1) {
    console.warn('\nWarning: Could not locate @Module imports array. Add manually.');
    return;
  }

  const importsKeyIdx = moduleDecoratorIdx + importsKeyOffset;

  // ─── 4. Find the matching closing ] of @Module imports array ──────────────
  const fromImports = content.slice(importsKeyIdx);
  const bracketOpen = fromImports.indexOf('[');
  let bracketDepth = 0;
  let closingBracketOffset = -1;

  for (let i = bracketOpen; i < fromImports.length; i++) {
    if (fromImports[i] === '[') bracketDepth++;
    if (fromImports[i] === ']') {
      bracketDepth--;
      if (bracketDepth === 0) {
        closingBracketOffset = i;
        break;
      }
    }
  }

  if (closingBracketOffset === -1) {
    console.warn('\nWarning: Could not find closing ] of imports array. Add manually.');
    return;
  }

  const closingBracketIdx = importsKeyIdx + closingBracketOffset;

  // ─── 5. Insert module before the closing ] ────────────────────────────────
  const before = content.slice(0, closingBracketIdx).trimEnd();
  const after = content.slice(closingBracketIdx);
  const needsComma = !before.endsWith('[');

  content = `${before}${needsComma ? ',' : ''}\n    ${featurePascal}Module,\n  ${after}`;

  fs.writeFileSync(appModulePath, content, 'utf8');
  console.log(`  updated  src/app.module.ts`);
}

// ─── File Templates ──────────────────────────────────────────────────────────

function generateSchemaFile(featurePascal: string, featureName: string): string {
  return `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ${featurePascal}Document = ${featurePascal} & Document;

@Schema({ timestamps: true })
export class ${featurePascal} {
  // TODO: define your fields here
  // @Prop({ required: true })
  // name!: string;
}

export const ${featurePascal}Schema = SchemaFactory.createForClass(${featurePascal});
`;
}

function generateCreateDtoFile(featurePascal: string): string {
  return `import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Create${featurePascal}Dto {
  // TODO: add fields with class-validator decorators
  // @IsString()
  // @IsNotEmpty()
  // name!: string;
  //
  // @IsString()
  // @IsOptional()
  // description?: string;
}
`;
}

function generateUpdateDtoFile(featurePascal: string, featureName: string): string {
  return `import { PartialType } from '@nestjs/mapped-types';
import { Create${featurePascal}Dto } from './create-${featureName}.dto';

// PartialType makes all Create fields optional automatically
export class Update${featurePascal}Dto extends PartialType(Create${featurePascal}Dto) {}
`;
}

function generateServiceFile(
  featurePascal: string,
  featureCamel: string,
  featureName: string,
  featureTitle: string,
): string {
  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Create${featurePascal}Dto } from './dto/create-${featureName}.dto';
import { Update${featurePascal}Dto } from './dto/update-${featureName}.dto';
import { ${featurePascal}, ${featurePascal}Document } from './schemas/${featureName}.schema';

@Injectable()
export class ${featurePascal}Service {
  constructor(
    @InjectModel(${featurePascal}.name)
    private readonly ${featureCamel}Model: Model<${featurePascal}Document>,
  ) {}

  async findAll(): Promise<${featurePascal}Document[]> {
    return this.${featureCamel}Model.find().exec();
  }

  async findOne(id: string): Promise<${featurePascal}Document> {
    const doc = await this.${featureCamel}Model.findById(id).exec();
    if (!doc) throw new NotFoundException('${featureTitle} not found');
    return doc;
  }

  async create(payload: Create${featurePascal}Dto): Promise<${featurePascal}Document> {
    const created = new this.${featureCamel}Model(payload);
    return created.save();
  }

  async update(id: string, payload: Update${featurePascal}Dto): Promise<${featurePascal}Document> {
    const updated = await this.${featureCamel}Model
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('${featureTitle} not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.${featureCamel}Model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('${featureTitle} not found');
    return { deleted: true };
  }
}
`;
}

function generateControllerFile(
  featurePascal: string,
  featureCamel: string,
  featureName: string,
): string {
  return `import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Create${featurePascal}Dto } from './dto/create-${featureName}.dto';
import { Update${featurePascal}Dto } from './dto/update-${featureName}.dto';
import { ${featurePascal}Service } from './${featureName}.service';

@Controller('${featureName}')
export class ${featurePascal}Controller {
  constructor(private readonly ${featureCamel}Service: ${featurePascal}Service) {}

  @Get()
  findAll() {
    return this.${featureCamel}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${featureCamel}Service.findOne(id);
  }

  @Post()
  create(@Body() payload: Create${featurePascal}Dto) {
    return this.${featureCamel}Service.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: Update${featurePascal}Dto) {
    return this.${featureCamel}Service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${featureCamel}Service.remove(id);
  }
}
`;
}

function generateModuleFile(featurePascal: string, featureName: string): string {
  return `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ${featurePascal}Controller } from './${featureName}.controller';
import { ${featurePascal}Service } from './${featureName}.service';
import { ${featurePascal}, ${featurePascal}Schema } from './schemas/${featureName}.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ${featurePascal}.name, schema: ${featurePascal}Schema },
    ]),
  ],
  controllers: [${featurePascal}Controller],
  providers: [${featurePascal}Service],
  exports: [${featurePascal}Service],
})
export class ${featurePascal}Module {}
`;
}