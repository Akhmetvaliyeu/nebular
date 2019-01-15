/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { NbMenuModule } from './menu.module';
import { NbMenuBag, NbMenuItem, NbMenuService } from './menu.service';
import { NbThemeModule } from '../../theme.module';
import { isUrlPathContain, isUrlPathEqual } from './url-matching-helpers';
import { pairwise, take } from 'rxjs/operators';
import { NbMenuComponent } from './menu.component';


let menuService;

@Component({
  template: `<nb-menu [items]="items" [tag]="menuTag"></nb-menu>`,
})
export class MenuTestComponent {
  constructor (public menuPublicService: NbMenuService) {}
  @Input() items: NbMenuItem[];
  @Input() menuTag: string;
  @ViewChild(NbMenuComponent) menuComponent: NbMenuComponent;
}

@Component({
  template: `
    <nb-menu [items]="firstMenuItems" [tag]="firstMenuTag"></nb-menu>
    <nb-menu [items]="secondMenuItems" [tag]="secondMenuTag"></nb-menu>
  `,
})
export class TwoMenuTestComponent {
  constructor (public menuPublicService: NbMenuService) {}
  @Input() firstMenuItems: NbMenuItem[];
  @Input() secondMenuItems: NbMenuItem[];
  @Input() firstMenuTag: string;
  @Input() secondMenuTag: string;
  @ViewChildren(NbMenuComponent) menuComponent: QueryList<NbMenuComponent>;
}

function createTestBed() {
  TestBed.configureTestingModule({
    imports: [
      NbThemeModule.forRoot(),
      NbMenuModule.forRoot(),
      RouterTestingModule.withRoutes([]),
      NoopAnimationsModule,
    ],
    declarations: [MenuTestComponent, TwoMenuTestComponent],
    providers: [NbMenuService],
  });
}

function createTestComponent(menuItems, menuTag = 'menu') {
  createTestBed();
  const fixture = TestBed.createComponent( MenuTestComponent );
  fixture.componentInstance.items = menuItems;
  fixture.componentInstance.menuTag = menuTag;
  menuService = fixture.componentInstance.menuPublicService;
  fixture.detectChanges();
  return fixture;
}

describe('NbMenuItem', () => {

  it('should set tag attribute for menu services', () => {
    const fixture = createTestComponent([
      {
        title: 'Home',
      },
    ], 'menu');
    const nbMenuTag = fixture.componentInstance.menuComponent.tag;
    expect(nbMenuTag).toEqual('menu');
  });

  it('should set icon to menu item', () => {
    const fixture = createTestComponent([
      {
        title: 'Home',
        icon: 'test-icon',
      },
    ]);
    const iconWrapper = fixture.nativeElement.querySelector('.menu-icon');
    expect(iconWrapper.classList).toContain('test-icon');
  });

  it('should set title to menu item', () => {
    const fixture = createTestComponent([
      {
        title: 'Test title',
      },
    ]);
    const titleWrapper = fixture.nativeElement.querySelector('.menu-title').innerHTML;
    expect(titleWrapper).toEqual('Test title');
  });

  it('should set link target to menu item', () => {
    const fixture = createTestComponent([
      {
        title: 'Link with _blank target',
        target: '_blank',
      },
      {
        title: 'Link with _self target',
        target: '_self',
      },
      {
        title: 'Link with any not valid target',
        target: 'anyNotValid',
      },
    ]);
    const menuLinks = fixture.nativeElement.querySelectorAll('a');
    expect(menuLinks[0].getAttribute('target')).toEqual('_blank');
    expect(menuLinks[1].getAttribute('target')).toEqual('_self');
    expect(menuLinks[2].getAttribute('target')).toEqual('anyNotValid');
  });

  it('group element should have only span, without link', () => {
    const fixture = createTestComponent([
      {
        title: 'Group item',
        group: true,
      },
    ]);
    const menuItem = fixture.nativeElement.querySelector('.menu-item');
    expect(menuItem.querySelector('a')).toBeNull();
    expect(menuItem.querySelector('span')).not.toBeNull();
  });

  it('hidden element should not be rendered', () => {
    const fixture = createTestComponent([
      {
        title: 'Visible item',
      },
      {
        title: 'Hidden item',
        hidden: true,
      },
      {
        title: 'Visible item',
      },
    ]);
    const menuList = fixture.nativeElement.querySelectorAll('.menu-item');
    expect(menuList.length).toEqual(2);
  });

  it('should set child menu items', () => {
    const fixture = createTestComponent([
      {
        title: 'Parent item',
        expanded: true,
        children: [
          {
            title: 'Child item',
          },
        ],
      },
    ]);
    const childList = fixture.nativeElement.querySelector('.menu-item > ul.menu-items');
    expect(childList.classList).toContain('expanded');
  });

  it('should expand child menu items', () => {
    const fixture = createTestComponent([
      {
        title: 'Parent item',
        expanded: true,
        children: [
          {
            title: 'Child item',
          },
        ],
      },
    ]);
    const parentItem = fixture.nativeElement.querySelector('.menu-item');
    expect(parentItem.querySelector('ul.menu-items')).not.toBeNull();
  });

  it('should set URL', () => {
    const fixture = createTestComponent([
      {
        title: 'Menu Item with link',
        url: 'https://test.link',
      },
    ]);
    const menuItem = fixture.nativeElement.querySelector('.menu-item');
    expect(menuItem.querySelector('a').getAttribute('href')).toEqual('https://test.link');
  });

  it('should set selected item', () => {
    const selectedItem = {
      title: 'Menu item selected',
      selected: true,
    };
    const fixture = createTestComponent([
      {
        title: 'Menu item not selected',
      },
      selectedItem,
    ]);
    const activeItem = fixture.nativeElement.querySelector('a.active');
    expect(activeItem.querySelector('span').innerHTML).toEqual(selectedItem.title);
  });

});

describe('menu services', () => {

  it('menu services should operate with menu by tag', () => {
    createTestBed();
    const twoMenuFixture = TestBed.createComponent(TwoMenuTestComponent);
    twoMenuFixture.componentInstance.firstMenuItems = [{ title: 'Home'}];
    twoMenuFixture.componentInstance.secondMenuItems = [{ title: 'Home'}];
    twoMenuFixture.componentInstance.firstMenuTag = 'menuFirst';
    twoMenuFixture.componentInstance.secondMenuTag = 'menuSecond';
    menuService = twoMenuFixture.componentInstance.menuPublicService;
    twoMenuFixture.detectChanges();
    const addItemObject = {
      title: 'Added item',
    };
    const firstMenuListOnInit = twoMenuFixture.nativeElement
      .querySelector('nb-menu:first-child')
      .querySelectorAll('[nbmenuitem]')
      .length;
    const secondMenuListOnInit = twoMenuFixture.nativeElement
      .querySelector('nb-menu:last-child')
      .querySelectorAll('[nbmenuitem]')
      .length;
    menuService.addItems([addItemObject], 'menuFirst');
    twoMenuFixture.detectChanges();
    const firstMenuListItemAdded = twoMenuFixture.nativeElement
      .querySelector('nb-menu:first-child')
      .querySelectorAll('[nbmenuitem]')
      .length;
    const secondMenuListItemAdded = twoMenuFixture.nativeElement
      .querySelector('nb-menu:last-child')
      .querySelectorAll('[nbmenuitem]')
      .length;
    expect(firstMenuListItemAdded).toEqual(firstMenuListOnInit + 1);
    expect(secondMenuListItemAdded).toEqual(secondMenuListOnInit);
  });

  it('addItems() should add new item to DOM', () => {
    const fixture = createTestComponent([
      {
        title: 'Existing item',
      },
    ]);
    const addItemObject = {
      title: 'Added item',
    };
    const menuListOnInit = fixture.nativeElement.querySelectorAll('li').length;
    menuService.addItems([addItemObject], 'menu');
    fixture.detectChanges();
    const menuListItemAdded = fixture.nativeElement.querySelectorAll('li').length;
    expect(menuListItemAdded).toBeGreaterThan(menuListOnInit);
  });

  it('getSelectedItem() should get selected menu item', (done) => {
    const selectedItem = {
      title: 'Menu item selected',
      selected: true,
    };
    createTestComponent([
      {
        title: 'Menu item not selected',
      },
      selectedItem,
    ]);
    menuService.getSelectedItem('menu').subscribe((menuBag: NbMenuBag) => {
      expect(menuBag.item.title).toEqual(selectedItem.title);
      done();
    });
  }, 1000);

  it('collapseAll() should hide all expanded items', (done) => {
    const fixture = createTestComponent([
      {
        title: 'Menu item collapsed',
        children: [
          {
            title: 'Menu item inner',
          },
        ],
      },
      {
        title: 'Menu item expanded 1',
        expanded: true,
        children: [
          {
            title: 'Menu item inner',
          },
        ],
      },
      {
        title: 'Menu item expanded 2',
        expanded: true,
        children: [
          {
            title: 'Menu item inner',
          },
        ],
      },
    ]);
    menuService.onSubmenuToggle()
      .pipe(pairwise(), take(1))
      .subscribe(([menuBagFirstCollapsed, menuBagSecondCollapsed]: NbMenuBag[]) => {
        expect(menuBagFirstCollapsed.item.title).toEqual('Menu item expanded 1');
        expect(menuBagSecondCollapsed.item.title).toEqual('Menu item expanded 2');
        done();
      });
    menuService.collapseAll();
    fixture.detectChanges();
  }, 1000);

});

describe('menu URL helpers', () => {

  it('isUrlPathContain should work by url segments', () => {
    expect(isUrlPathContain('/a/ba', '/a/b')).toBeFalsy();
    expect(isUrlPathContain('/a/b/c', '/a/b')).toBeTruthy();
  });

  it('isUrlPathContain should work for url with fragments', () => {
    expect(isUrlPathContain('/a/b#fragment', '/a/b')).toBeTruthy();
  });

  it('isUrlPathContain should work for url with query strings', () => {
    expect(isUrlPathContain('/a/b?a=1;b=2&c=3', '/a/b')).toBeTruthy();
  });

  it('isUrlPathEqual should work for identical paths', () => {
    expect(isUrlPathEqual('/a/b/c', '/a/b')).toBeFalsy();
    expect(isUrlPathEqual('/a/b/c', '/a/b/c')).toBeTruthy();
  });

  it('isUrlPathEqual should work for url with fragments', () => {
    expect(isUrlPathEqual('/a/b/c#fragment', '/a/b/c')).toBeTruthy();
  });

  it('isUrlPathEqual should work for url with query strings', () => {
    expect(isUrlPathEqual('/a/b/c?a=1;b=2&c=3', '/a/b/c')).toBeTruthy();
  });

});
