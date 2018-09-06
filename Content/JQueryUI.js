// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
(function()
{
 "use strict";
 var Global,WebSharper,JQueryUI,Tests,Client,Obj,Html,Client$1,Pagelet,Tags,Operators,List,Utils,Pagelet$1,Tabs,EventTarget,Node,TagBuilder,T,Arrays,Accordion,Operators$1,Button,AutocompleteConfiguration,Datepicker,DatepickerConfiguration,Draggable,Attr,DraggableConfiguration,DialogConfiguration,DialogButton,Dialog,Progressbar,ProgressbarConfiguration,Slider,Element,TabsConfiguration,Sortable,PositionConfiguration,Target,Position,Resizable,WindowOrWorkerGlobalScope,SC$1,JavaScript,Pervasives,AccordionConfiguration,EventsPervasives,ButtonConfiguration,Unchecked,Autocomplete,AttributeBuilder,SliderConfiguration,Seq,SortableConfiguration,ResizableConfiguration,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,Enumerator,Text,T$1,Object,SC$2,Attribute,Events,JQueryEventSupport,console,IntelliFactory,Runtime,Math;
 Global=self;
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 JQueryUI=WebSharper.JQueryUI=WebSharper.JQueryUI||{};
 Tests=JQueryUI.Tests=JQueryUI.Tests||{};
 Client=Tests.Client=Tests.Client||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client$1=Html.Client=Html.Client||{};
 Pagelet=Client$1.Pagelet=Client$1.Pagelet||{};
 Tags=Client$1.Tags=Client$1.Tags||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 List=WebSharper.List=WebSharper.List||{};
 Utils=JQueryUI.Utils=JQueryUI.Utils||{};
 Pagelet$1=Utils.Pagelet=Utils.Pagelet||{};
 Tabs=JQueryUI.Tabs=JQueryUI.Tabs||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 TagBuilder=Client$1.TagBuilder=Client$1.TagBuilder||{};
 T=List.T=List.T||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Accordion=JQueryUI.Accordion=JQueryUI.Accordion||{};
 Operators$1=Client$1.Operators=Client$1.Operators||{};
 Button=JQueryUI.Button=JQueryUI.Button||{};
 AutocompleteConfiguration=JQueryUI.AutocompleteConfiguration=JQueryUI.AutocompleteConfiguration||{};
 Datepicker=JQueryUI.Datepicker=JQueryUI.Datepicker||{};
 DatepickerConfiguration=JQueryUI.DatepickerConfiguration=JQueryUI.DatepickerConfiguration||{};
 Draggable=JQueryUI.Draggable=JQueryUI.Draggable||{};
 Attr=Client$1.Attr=Client$1.Attr||{};
 DraggableConfiguration=JQueryUI.DraggableConfiguration=JQueryUI.DraggableConfiguration||{};
 DialogConfiguration=JQueryUI.DialogConfiguration=JQueryUI.DialogConfiguration||{};
 DialogButton=JQueryUI.DialogButton=JQueryUI.DialogButton||{};
 Dialog=JQueryUI.Dialog=JQueryUI.Dialog||{};
 Progressbar=JQueryUI.Progressbar=JQueryUI.Progressbar||{};
 ProgressbarConfiguration=JQueryUI.ProgressbarConfiguration=JQueryUI.ProgressbarConfiguration||{};
 Slider=JQueryUI.Slider=JQueryUI.Slider||{};
 Element=Client$1.Element=Client$1.Element||{};
 TabsConfiguration=JQueryUI.TabsConfiguration=JQueryUI.TabsConfiguration||{};
 Sortable=JQueryUI.Sortable=JQueryUI.Sortable||{};
 PositionConfiguration=JQueryUI.PositionConfiguration=JQueryUI.PositionConfiguration||{};
 Target=JQueryUI.Target=JQueryUI.Target||{};
 Position=JQueryUI.Position=JQueryUI.Position||{};
 Resizable=JQueryUI.Resizable=JQueryUI.Resizable||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 SC$1=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 AccordionConfiguration=JQueryUI.AccordionConfiguration=JQueryUI.AccordionConfiguration||{};
 EventsPervasives=Client$1.EventsPervasives=Client$1.EventsPervasives||{};
 ButtonConfiguration=JQueryUI.ButtonConfiguration=JQueryUI.ButtonConfiguration||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Autocomplete=JQueryUI.Autocomplete=JQueryUI.Autocomplete||{};
 AttributeBuilder=Client$1.AttributeBuilder=Client$1.AttributeBuilder||{};
 SliderConfiguration=JQueryUI.SliderConfiguration=JQueryUI.SliderConfiguration||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 SortableConfiguration=JQueryUI.SortableConfiguration=JQueryUI.SortableConfiguration||{};
 ResizableConfiguration=JQueryUI.ResizableConfiguration=JQueryUI.ResizableConfiguration||{};
 Implementation=Client$1.Implementation=Client$1.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 Text=Client$1.Text=Client$1.Text||{};
 T$1=Enumerator.T=Enumerator.T||{};
 Object=Global.Object;
 SC$2=Global.StartupCode$WebSharper_Html_Client$Events=Global.StartupCode$WebSharper_Html_Client$Events||{};
 Attribute=Client$1.Attribute=Client$1.Attribute||{};
 Events=Client$1.Events=Client$1.Events||{};
 JQueryEventSupport=Events.JQueryEventSupport=Events.JQueryEventSupport||{};
 console=Global.console;
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 Math=Global.Math;
 Client.Tests=function()
 {
  var a;
  (a=[Tabs.New2(List.ofArray([["Accordion",Client.TestAccordion()],["Autocomplete1",Client.TestAutocomplete1()],["Autocomplete2",Client.TestAutocomplete2()],["Autocomplete3",Client.TestAutocomplete3()],["Button",Client.TestButton()],["Datepicker1",Client.TestDatepicker1()],["Datepicker2",Client.TestDatepicker2()],["Datepicker3",Client.TestDatepicker3()],["Draggable",Client.TestDraggable()],["Dialog",Client.TestDialog()],["Progressbar",Client.TestProgressbar()],["Slider",Client.TestSlider()],["Tabs",Client.TestTabs()],["Sortable",Client.TestSortable()],["Position",Client.TestPosition()],["Resizable",Client.TestResizable()]]))],Tags.Tags().NewTag("div",a)).AppendTo("main");
 };
 Client.TestAccordion=function()
 {
  var acc1,a,a$1,a$2,acc2,a$3,a$4,button;
  acc1=Accordion.New2(List.ofArray([["Foo",(a=[Tags.Tags().NewTag("button",[Tags.Tags().text("click")])],Tags.Tags().NewTag("div",a))],["Bar",(a$1=[Tags.Tags().text("Second content")],Tags.Tags().NewTag("div",a$1))],["Baz",(a$2=[Tags.Tags().text("Third content")],Tags.Tags().NewTag("div",a$2))]]));
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Acc1 - Before Render");
  },acc1);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("Acc1 - After Render");
  },acc1);
  acc1.OnActivate(function()
  {
   return function()
   {
    return Client.Log("Acc1 - Activate");
   };
  });
  acc2=Accordion.New2(List.ofArray([["Foo",Tags.Tags().NewTag("div",[acc1])],["Bar",(a$3=[Tags.Tags().text("Second content")],Tags.Tags().NewTag("div",a$3))],["Baz",(a$4=[Tags.Tags().text("Third content")],Tags.Tags().NewTag("div",a$4))]]));
  acc2.OnActivate(function()
  {
   return function()
   {
    return Client.Log("Acc2 - Activate");
   };
  });
  Button.New4("Click").OnClick(function()
  {
   Global.jQuery(acc2.element.Dom).accordion("option","active",2);
   Global.jQuery(acc1.element.Dom).accordion("disable");
  });
  button=Button.New4("Click");
  button.OnClick(function()
  {
   Global.jQuery(acc2.element.Dom).accordion("option","active",1);
  });
  return Operators$1.add(Tags.Tags().NewTag("div",[acc2]),[button]);
 };
 Client.TestAutocomplete1=function()
 {
  var conf;
  conf=new AutocompleteConfiguration.New();
  conf.set_Source({
   $:0,
   $0:["Apa","Beta","Zeta","Zebra"]
  });
  return Client.RunAutocompleter(conf);
 };
 Client.TestAutocomplete2=function()
 {
  var conf;
  conf=new AutocompleteConfiguration.New();
  conf.set_Source({
   $:1,
   $0:[{
    label:"test",
    value:"value"
   }]
  });
  return Client.RunAutocompleter(conf);
 };
 Client.TestAutocomplete3=function()
 {
  var conf;
  function completef(a,f)
  {
   f([{
    label:"test",
    value:"value"
   }]);
  }
  conf=new AutocompleteConfiguration.New();
  conf.set_Source({
   $:3,
   $0:function($1)
   {
    return completef($1[0],$1[1]);
   }
  });
  return Client.RunAutocompleter(conf);
 };
 Client.TestButton=function()
 {
  var b1,b2;
  b1=Button.New4("Click");
  Operators$1.OnAfterRender(function()
  {
   Client.Log("After Render");
  },b1);
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Before Render");
  },b1);
  b1.OnClick(function()
  {
   Client.Log("Click");
  });
  b2=Button.New4("Click 2");
  b2.OnClick(function()
  {
   b1.OnClick(function()
   {
    Client.Log("New CB");
   });
   b1.get_IsEnabled()?b1.Disable():b1.Enable();
  });
  return Tags.Tags().NewTag("div",[b1,b2]);
 };
 Client.TestDatepicker1=function()
 {
  var conf,dp;
  conf=new DatepickerConfiguration.New();
  dp=Datepicker.New1(Tags.Tags().NewTag("input",[]),conf);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("Dp After Render");
  },dp);
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Dp Before Render");
  },dp);
  return Tags.Tags().NewTag("div",[dp]);
 };
 Client.TestDatepicker2=function()
 {
  var conf,r,dp;
  conf=(r=new DatepickerConfiguration.New(),r.autoSize=true,r);
  dp=Datepicker.New1(Tags.Tags().NewTag("input",[]),conf);
  dp.OnClose(function($1,$2)
  {
   Client.Log("Dp2 OnClose");
   console.log($1);
   return console.log($2);
  });
  dp.OnSelect(function($1,$2)
  {
   Client.Log("Dp2 OnSelect");
   console.log($1);
   return console.log($2);
  });
  Operators$1.OnAfterRender(function(picker)
  {
   Global.jQuery(picker.element.Dom).datepicker("option","changeYear",true);
  },dp);
  Operators$1.OnAfterRender(function(picker)
  {
   Client.Log("Dp2 After Render");
   Client.Log(Global.String(Global.jQuery(picker.element.Dom).datepicker("option","changeYear")));
   Client.Log(Global.String(Global.jQuery(picker.element.Dom).datepicker("option","autoSize")));
   console.log(Global.jQuery(picker.element.Dom).datepicker("option","all"));
  },dp);
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Dp2 Before Render");
  },dp);
  return Tags.Tags().NewTag("div",[dp]);
 };
 Client.TestDatepicker3=function()
 {
  var conf,r,dp;
  conf=(r=new DatepickerConfiguration.New(),r.autoSize=true,r.onClose=function(dt)
  {
   Client.Log("Dp3 OnClose");
   console.log(dt);
  },r.onSelect=function(dt)
  {
   Client.Log("Dp3 OnSelect");
   console.log(dt);
  },r);
  dp=Datepicker.New1(Tags.Tags().NewTag("input",[]),conf);
  Operators$1.OnAfterRender(function(picker)
  {
   Global.jQuery(picker.element.Dom).datepicker("option","changeYear",true);
  },dp);
  Operators$1.OnAfterRender(function(picker)
  {
   Client.Log("Dp3 After Render");
   Client.Log(Global.String(Global.jQuery(picker.element.Dom).datepicker("option","changeYear")));
   Client.Log(Global.String(Global.jQuery(picker.element.Dom).datepicker("option","autoSize")));
   console.log(Global.jQuery(picker.element.Dom).datepicker("option","all"));
  },dp);
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Dp3 Before Render");
  },dp);
  return Tags.Tags().NewTag("div",[dp]);
 };
 Client.TestDraggable=function()
 {
  var a,a$1,r;
  a=[Draggable.New1((a$1=[Attr.Attr().NewAttr("style","width:200px;background:lightgray;text-align:center"),Tags.Tags().text("Drag me!")],Tags.Tags().NewTag("div",a$1)),(r=new DraggableConfiguration.New(),r.axis="x",r))];
  return Tags.Tags().NewTag("div",a);
 };
 Client.TestDialog=function()
 {
  var conf,r,d,a,bO,bC;
  conf=new DialogConfiguration.New();
  conf.buttons=[(r=new DialogButton.New(),r.text="Ok",r.set_click(function($1)
  {
   return Global.jQuery($1.element.Dom).dialog("close");
  }),r)];
  conf.autoOpen=false;
  d=Dialog.New1((a=[Tags.Tags().text("Dialog")],Tags.Tags().NewTag("div",a)),conf);
  d.OnClose(function()
  {
   Client.Log("close");
  });
  Operators$1.OnAfterRender(function()
  {
   Client.Log("dialog: before render");
  },d);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("dialog: after render");
  },d);
  d.OnOpen(function()
  {
   Client.Log("dialog: open");
  });
  d.OnClose(function()
  {
   Client.Log("dialog: close");
  });
  d.OnResize(function()
  {
   Client.Log("dialog: resize");
  });
  d.OnResizeStop(function()
  {
   Client.Log("dialog: resize stop");
  });
  d.OnResizeStart(function()
  {
   Client.Log("dialog: resize start");
  });
  d.OnFocus(function()
  {
   Client.Log("dialog: focus");
  });
  d.OnDrag(function()
  {
   Client.Log("dialog: drag");
  });
  d.OnDragStart(function()
  {
   Client.Log("dialog: drag start");
  });
  d.OnDragStop(function()
  {
   Client.Log("dialog: drag stop");
  });
  bO=Button.New4("open");
  bO.OnClick(function()
  {
   Global.jQuery(d.element.Dom).dialog("open");
  });
  bC=Button.New4("Close");
  bC.OnClick(function()
  {
   Global.jQuery(d.element.Dom).dialog("close");
  });
  return Operators$1.add(Tags.Tags().NewTag("div",[d]),[bO,bC]);
 };
 Client.TestProgressbar=function()
 {
  var conf,p,b;
  conf=new ProgressbarConfiguration.New();
  p=Progressbar.New1(Tags.Tags().NewTag("div",[]),conf);
  Operators$1.OnAfterRender(function()
  {
   p.set_Value(30);
  },p);
  b=Button.New4("inc");
  b.OnClick(function()
  {
   p.set_Value(p.get_Value()+10);
  });
  return Tags.Tags().NewTag("div",[p,b]);
 };
 Client.TestSlider=function()
 {
  var s,b,pan;
  s=Slider.New2();
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("slider: before render");
  },s);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("slider: after render");
  },s);
  s.OnChange(function()
  {
   Client.Log("change");
  });
  b=Button.New4("check");
  pan=Tags.Tags().NewTag("div",[s,b]);
  b.OnClick(function()
  {
   var a,x;
   pan.AppendI(Dialog.New2((a=[(x=Global.String(s.get_Value()),Tags.Tags().text(x))],Tags.Tags().NewTag("div",a))));
  });
  return pan;
 };
 Client.TestTabs=function()
 {
  var conf,t,a,a$1,a$2,a$3,a$4,b;
  conf=new TabsConfiguration.New();
  t=Tabs.New1(List.ofArray([["Tab 1",(a=[(a$1=[Tags.Tags().text("Tab 1")],Tags.Tags().NewTag("h1",a$1))],Tags.Tags().NewTag("div",a))],["Tab 2",(a$2=[(a$3=[Tags.Tags().text("Tab 2")],Tags.Tags().NewTag("h1",a$3))],Tags.Tags().NewTag("div",a$2))],["Tab 3",(a$4=[Tags.Tags().text("R")],Tags.Tags().NewTag("div",a$4))]]),conf);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("Aa");
  },t);
  b=Button.New4("inc");
  b.OnClick(function()
  {
   var a$5,a$6;
   Global.jQuery(t.get_TabContainer().get_Body()).children().eq(2).click();
   t.Add((a$5=[(a$6=[Tags.Tags().text("New tab")],Tags.Tags().NewTag("h1",a$6))],Tags.Tags().NewTag("div",a$5)),"Tab"+Global.String(t.get_Length()+1));
  });
  return Tags.Tags().NewTag("div",[t,b]);
 };
 Client.TestSortable=function()
 {
  var a,x,a$1;
  a=[Sortable.New2((x=List.map(function(e)
  {
   var a$2;
   a$2=[Tags.Tags().NewTag("img",[e])];
   return Tags.Tags().NewTag("li",a$2);
  },List.init(6,function(i)
  {
   return Attr.Attr().NewAttr("src","http://www.look4design.co.uk/l4design/companies/designercurtains/image"+Global.String(i+1)+".jpg");
  })),Operators$1.add((a$1=[Attr.Attr().NewAttr("style","list-style: none")],Tags.Tags().NewTag("ul",a$1)),x)))];
  return Tags.Tags().NewTag("div",a);
 };
 Client.TestPosition=function()
 {
  var position1Body,a,a$1,x,a$2;
  function f(el)
  {
   var conf1;
   conf1=new PositionConfiguration.New();
   conf1.my="center";
   conf1.at="center";
   conf1.set_Of(new Target({
    $:0,
    $0:el.Dom
   }));
   conf1.collision="fit";
   conf1.offset="10 -10";
   Position.New1(position1Body,conf1);
  }
  position1Body=(a=[Attr.Attr().NewAttr("style","width:50px; height:50px; background-color:#F00;")],Tags.Tags().NewTag("div",a));
  a$1=[position1Body,(x=(a$2=[Attr.Attr().NewAttr("style","width:240px; height:200px; background-color:#999; margin:30px auto;"),Tags.Tags().text("hej")],Tags.Tags().NewTag("div",a$2)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a$1);
 };
 Client.TestResizable=function()
 {
  var resizable,a,a$1;
  resizable=Resizable.New2((a=[Attr.Attr().NewAttr("style","background:url(http://www.look4design.co.uk/l4design/companies/light-iq/image14.jpg);height:100px;width:100px")],Tags.Tags().NewTag("div",a)));
  resizable.OnStart(function()
  {
   return function()
   {
    return Client.Log("Started!");
   };
  });
  resizable.OnResize(function()
  {
   return function(ui)
   {
    ui.size.width>300?ui.size.width=300:void 0;
    ui.size.height<200?ui.size.height=200:void 0;
    return Client.Log("Resized!");
   };
  });
  resizable.OnStop(function()
  {
   return function()
   {
    return Client.Log("Stopped!");
   };
  });
  a$1=[Draggable.New2(Tags.Tags().NewTag("div",[resizable]))];
  return Tags.Tags().NewTag("div",a$1);
 };
 Client.Log=function(x)
 {
  console.log(x);
 };
 Client.RunAutocompleter=function(conf)
 {
  var a,bClose,bDestroy;
  function a$1(a$2,a$3)
  {
   return Client.Log("Focus");
  }
  a=Autocomplete.New1(Tags.Tags().NewTag("input",[]),conf);
  Operators$1.OnBeforeRender(function()
  {
   Client.Log("Before Render");
  },a);
  Operators$1.OnAfterRender(function()
  {
   Client.Log("After Render");
  },a);
  a.OnChange(function()
  {
   return function()
   {
    return Client.Log("Change");
   };
  });
  a.OnClose(function()
  {
   Client.Log("Close");
  });
  a.OnSearch(function()
  {
   Client.Log("Search");
  });
  a.OnFocus(function($1)
  {
   return function($2)
   {
    return a$1($1,$2);
   };
  });
  bClose=Button.New4("Close");
  bClose.OnClick(function()
  {
   Global.jQuery(a.element.Dom).autocomplete("close");
  });
  bDestroy=Button.New4("Destroy");
  bClose.OnClick(function()
  {
   Global.jQuery(a.element.Dom).autocomplete("destroy");
  });
  return Operators$1.add(Tags.Tags().NewTag("div",[a]),[bClose,bDestroy]);
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 Pagelet=Client$1.Pagelet=Runtime.Class({
  AppendTo:function(targetId)
  {
   self.document.getElementById(targetId).appendChild(this.get_Body());
   this.Render();
  },
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Tags.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags$1;
 };
 Operators.FailWith=function(msg)
 {
  throw new Global.Error(msg);
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.init=function(s,f)
 {
  return List.ofArray(Arrays.init(s,f));
 };
 List.map=function(f,x)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return x;
  else
   {
    res=new T({
     $:1
    });
    r=res;
    l=x;
    go=true;
    while(go)
     {
      r.$0=f(l.$0);
      l=l.$1;
      l.$==0?go=false:r=(t=new T({
       $:1
      }),r.$1=t,t);
     }
    r.$1=T.Empty;
    return res;
   }
 };
 List.concat=function(s)
 {
  return List.ofSeq(Seq.concat(s));
 };
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T.Empty;
      else
       {
        res=new T({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          e.MoveNext()?r=(t=new T({
           $:1
          }),r.$1=t,t):go=false;
         }
        r.$1=T.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 Pagelet$1=Utils.Pagelet=Runtime.Class({
  get_Body:function()
  {
   return this.element.get_Body();
  },
  Render:function()
  {
   this.element.Render();
  }
 },Pagelet,Pagelet$1);
 Pagelet$1.New=Runtime.Ctor(function()
 {
  Pagelet.New.call(this);
 },Pagelet$1);
 Tabs=JQueryUI.Tabs=Runtime.Class({
  get_TabContainer:function()
  {
   return this.tabContainer;
  },
  Add:function(el,label)
  {
   var id,tab,a,a$1,panel,a$2;
   id="id"+Math.round(Math.random()*100000000);
   tab=(a=[(a$1=[Attr.Attr().NewAttr("href","#"+id),Tags.Tags().text(label)],Tags.Tags().NewTag("a",a$1))],Tags.Tags().NewTag("li",a));
   panel=Operators$1.add((a$2=[Attr.Attr().NewAttr("id",id)],Tags.Tags().NewTag("div",a$2)),[el]);
   this.tabContainer.AppendI(tab);
   this.panelContainer.AppendI(panel);
   Global.jQuery(this.element.Dom).tabs("refresh");
  },
  get_Length:function()
  {
   return Global.jQuery(this.tabContainer.Dom).children().length;
  }
 },Pagelet$1,Tabs);
 Tabs.New2=function(els)
 {
  return Tabs.New1(els,new TabsConfiguration.New());
 };
 Tabs.New1=function(els,conf)
 {
  var p,itemPanels,tabs,a,panelContainer,tabs$1;
  function m(label,panel)
  {
   var id,a$1,a$2,a$3;
   id="id"+Math.round(Math.random()*100000000);
   return[(a$1=[(a$2=[Attr.Attr().NewAttr("href","#"+id),Tags.Tags().text(label)],Tags.Tags().NewTag("a",a$2))],Tags.Tags().NewTag("li",a$1)),Operators$1.add((a$3=[Attr.Attr().NewAttr("id",id)],Tags.Tags().NewTag("div",a$3)),[panel])];
  }
  function f(el)
  {
   Global.jQuery(el.Dom).tabs(conf);
  }
  p=(itemPanels=List.map(function($1)
  {
   return m($1[0],$1[1]);
  },els),(tabs=Tags.Tags().NewTag("ul",Seq.map(function(t)
  {
   return t[0];
  },itemPanels)),[(a=new T({
   $:1,
   $0:tabs,
   $1:List.map(function(t)
   {
    return t[1];
   },itemPanels)
  }),Tags.Tags().NewTag("div",a)),tabs]));
  panelContainer=p[0];
  tabs$1=new Tabs.New(p[1],panelContainer);
  tabs$1.element=(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(panelContainer),panelContainer);
  return tabs$1;
 };
 Tabs.New=Runtime.Ctor(function(tabContainer,panelContainer)
 {
  Pagelet$1.New.call(this);
  this.tabContainer=tabContainer;
  this.panelContainer=panelContainer;
 },Tabs);
 TagBuilder=Client$1.TagBuilder=Runtime.Class({
  NewTag:function(name,children)
  {
   var el,e;
   el=Element.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  },
  text:function(data)
  {
   return new Text.New(data);
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Accordion=JQueryUI.Accordion=Runtime.Class({
  OnActivate:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("accordionactivate",function(x,y)
    {
     (f(x))(y);
    });
   },this);
  }
 },Pagelet$1,Accordion);
 Accordion.New2=function(els)
 {
  return Accordion.New1(els,new AccordionConfiguration.New());
 };
 Accordion.New1=function(els,conf)
 {
  var a,x,a$1;
  function m(header,el)
  {
   var a$2,a$3;
   return List.ofArray([(a$2=[(a$3=[Attr.Attr().NewAttr("href","#"),Tags.Tags().text(header)],Tags.Tags().NewTag("a",a$3))],Tags.Tags().NewTag("h3",a$2)),Tags.Tags().NewTag("div",[el])]);
  }
  function f(el)
  {
   Global.jQuery(el.Dom).accordion(conf);
  }
  a=new Accordion.New();
  a.element=(x=(a$1=List.concat(List.map(function($1)
  {
   return m($1[0],$1[1]);
  },els)),Tags.Tags().NewTag("div",a$1)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x));
  return a;
 };
 Accordion.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Accordion);
 Operators$1.OnBeforeRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   f(w);
   r.apply(w);
  };
 };
 Operators$1.OnAfterRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   r.apply(w);
   f(w);
  };
 };
 Operators$1.add=function(el,inner)
 {
  var e;
  e=Enumerator.Get(inner);
  try
  {
   while(e.MoveNext())
    el.AppendI(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return el;
 };
 Button=JQueryUI.Button=Runtime.Class({
  OnClick:function(f)
  {
   var $this,a;
   function a$1(a$2,ev)
   {
    return $this.isEnabled?f(ev):null;
   }
   $this=this;
   a=this.element;
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$1($1,$2);
    };
   },a);
  },
  get_IsEnabled:function()
  {
   return this.isEnabled;
  },
  Disable:function()
  {
   this.isEnabled=false;
   Global.jQuery(this.element.Dom).button("disable");
  },
  Enable:function()
  {
   this.isEnabled=true;
   Global.jQuery(this.element.Dom).button("enable");
  }
 },Pagelet$1,Button);
 Button.New4=function(label)
 {
  var r;
  return Button.New3((r=new ButtonConfiguration.New(),r.label=label,r));
 };
 Button.New3=function(conf)
 {
  return Button.New1(Tags.Tags().NewTag("button",[]),conf);
 };
 Button.New1=function(el,conf)
 {
  var b;
  b=new Button.New();
  b.isEnabled=true;
  Operators$1.OnAfterRender(function(el$1)
  {
   Global.jQuery(el$1.Dom).button(conf);
  },el);
  b.element=el;
  return b;
 };
 Button.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Button);
 AutocompleteConfiguration=JQueryUI.AutocompleteConfiguration=Runtime.Class({
  set_Source:function(s)
  {
   if(s.$==1)
    this.source=s.$0;
   else
    if(s.$==2)
     this.source=s.$0;
    else
     if(s.$==3)
      this.setCallback(s.$0);
     else
      this.source=s.$0;
  },
  setCallback:function(scall)
  {
   return this.source=function(x,y)
   {
    scall([x,y]);
   };
  }
 },Obj,AutocompleteConfiguration);
 AutocompleteConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AppendTo=null;
  this.AutoFocus=null;
  this.Delay=0;
  this.Disabled=null;
  this.MinLength=0;
  this.Position=null;
 },AutocompleteConfiguration);
 Datepicker=JQueryUI.Datepicker=Runtime.Class({
  OnClose:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    function a(a$1,d)
    {
     return f(Global.jQuery($this.element.Dom).datepicker("getDate"),d);
    }
    Global.jQuery($this.element.Dom).datepicker("option",{
     onClose:function(x,y)
     {
      ((function($1)
      {
       return function($2)
       {
        return a($1,$2);
       };
      }(x))(y));
     }
    });
   },this);
  },
  OnSelect:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    function a(a$1,d)
    {
     return f(Global.jQuery($this.element.Dom).datepicker("getDate"),d);
    }
    Global.jQuery($this.element.Dom).datepicker("option",{
     onSelect:function(x,y)
     {
      ((function($1)
      {
       return function($2)
       {
        return a($1,$2);
       };
      }(x))(y));
     }
    });
   },this);
  }
 },Pagelet$1,Datepicker);
 Datepicker.New1=function(el,conf)
 {
  var dp;
  dp=new Datepicker.New();
  dp.element=el;
  Operators$1.OnAfterRender(function(el$1)
  {
   Global.jQuery(el$1.Dom).datepicker(conf);
  },el);
  return dp;
 };
 Datepicker.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Datepicker);
 DatepickerConfiguration=JQueryUI.DatepickerConfiguration=Runtime.Class({},Obj,DatepickerConfiguration);
 DatepickerConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AltField=null;
  this.AltFormat=null;
  this.AppendText=null;
  this.AutoSize=null;
  this.ButtonImage=null;
  this.ButtonImageOnly=null;
  this.ButtonText=null;
  this.CalculateWeek=null;
  this.ChangeMonth=null;
  this.ChangeYear=null;
  this.CloseText=null;
  this.ConstrainInput=null;
  this.CurrentText=null;
  this.DateFormat=null;
  this.DayNames=null;
  this.DayNamesMin=null;
  this.DayNamesShort=null;
  this.DefaultDate=null;
  this.Duration=null;
  this.FirstDay=0;
  this.GotoCurrent=null;
  this.HideIfNoPrevNext=null;
  this.isRTL=null;
  this.MaxDate=null;
  this.MinDate=null;
  this.MonthNames=null;
  this.MonthNamesShort=null;
  this.NavigationAsDateFormat=null;
  this.NextText=null;
  this.NumberOfMonths=null;
  this.OnChangeMonthYear=null;
  this.OnClose=null;
  this.OnSelect=null;
  this.PrevText=null;
  this.SelectOtherMonths=null;
  this.ShortYearCutoff=0;
  this.ShowAnim=null;
  this.ShowButtonPanel=null;
  this.ShowCurrentAtPos=0;
  this.ShowMonthAfterYear=null;
  this.ShowOn=null;
  this.ShowOptions=null;
  this.ShowOtherMonths=null;
  this.ShowWeek=null;
  this.StepMonths=0;
  this.WeekHeader=null;
  this.YearRange=null;
  this.YearSuffix=null;
 },DatepickerConfiguration);
 Draggable=JQueryUI.Draggable=Runtime.Class({},Pagelet$1,Draggable);
 Draggable.New1=function(el,conf)
 {
  var a;
  function f(el$1)
  {
   Global.jQuery(el$1.Dom).draggable(conf);
  }
  a=new Draggable.New();
  a.element=(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(el),el);
  return a;
 };
 Draggable.New2=function(el)
 {
  return Draggable.New1(el,new DraggableConfiguration.New());
 };
 Draggable.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Draggable);
 Attr.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr$1;
 };
 DraggableConfiguration=JQueryUI.DraggableConfiguration=Runtime.Class({},Obj,DraggableConfiguration);
 DraggableConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AddClasses=null;
  this.AppendTo=null;
  this.Axis=null;
  this.Cancel=null;
  this.ConnectToSortable=null;
  this.Containment=null;
  this.Cursor=null;
  this.CursorAt=null;
  this.Delay=0;
  this.Disabled=null;
  this.Distance=0;
  this.Grid=null;
  this.Handle=null;
  this.Helper=null;
  this.IframeFix=null;
  this.Opacity=0;
  this.RefreshPositions=null;
  this.Revert=null;
  this.RevertDuration=0;
  this.Scope=null;
  this.Scroll=null;
  this.ScrollSensitivity=0;
  this.ScrollSpeed=0;
  this.Snap=null;
  this.SnapMode=null;
  this.SnapTolerance=0;
  this.Stack=null;
  this.ZIndex=0;
 },DraggableConfiguration);
 DialogConfiguration=JQueryUI.DialogConfiguration=Runtime.Class({},Obj,DialogConfiguration);
 DialogConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AppendTo=null;
  this.AutoOpen=null;
  this.Buttons=null;
  this.CloseOnEscape=null;
  this.CloseText=null;
  this.DialogClass=null;
  this.Draggable=null;
  this.Height=0;
  this.Hide=null;
  this.MaxHeight=0;
  this.MaxWidth=0;
  this.MinHeight=0;
  this.MinWidth=0;
  this.Modal=null;
  this.Position=null;
  this.Resizable=null;
  this.Show=null;
  this.Title=null;
  this.Width=0;
 },DialogConfiguration);
 DialogButton=JQueryUI.DialogButton=Runtime.Class({
  set_click:function(f)
  {
   function f$1(el,ev)
   {
    return f(Dialog.OfExisting(el),ev);
   }
   this.click=function(e)
   {
    ((function($1)
    {
     return function($2)
     {
      return f$1($1,$2);
     };
    }({
     Dom:this,
     Render:Global.ignore
    }))(e));
   };
  }
 },Obj,DialogButton);
 DialogButton.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Text=null;
 },DialogButton);
 Dialog=JQueryUI.Dialog=Runtime.Class({
  OnClose:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogclose",function(x)
    {
     f(x);
    });
   },this);
  },
  OnOpen:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogopen",function(x)
    {
     f(x);
    });
   },this);
  },
  OnResize:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogresize",function(x)
    {
     f(x);
    });
   },this);
  },
  OnResizeStop:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogresizestop",function(x)
    {
     f(x);
    });
   },this);
  },
  OnResizeStart:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogresizestart",function(x)
    {
     f(x);
    });
   },this);
  },
  OnFocus:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogfocus",function(x)
    {
     f(x);
    });
   },this);
  },
  OnDrag:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogdrag",function(x)
    {
     f(x);
    });
   },this);
  },
  OnDragStart:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogdragstart",function(x)
    {
     f(x);
    });
   },this);
  },
  OnDragStop:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("dialogdragstop",function(x)
    {
     f(x);
    });
   },this);
  }
 },Pagelet$1,Dialog);
 Dialog.New1=function(el,conf)
 {
  var d;
  d=new Dialog.New();
  Operators$1.OnAfterRender(function(el$1)
  {
   Global.jQuery(el$1.Dom).dialog(conf);
  },el);
  d.element=el;
  return d;
 };
 Dialog.New2=function(el)
 {
  return Dialog.New1(el,new DialogConfiguration.New());
 };
 Dialog.OfExisting=function(el)
 {
  var r;
  r=new Dialog.New();
  r.element=el;
  return r;
 };
 Dialog.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Dialog);
 Progressbar=JQueryUI.Progressbar=Runtime.Class({
  set_Value:function(v)
  {
   Global.jQuery(this.element.Dom).progressbar("value",v);
  },
  get_Value:function()
  {
   return Global.jQuery(this.element.Dom).progressbar("value");
  }
 },Pagelet$1,Progressbar);
 Progressbar.New1=function(el,conf)
 {
  var pb;
  pb=new Progressbar.New();
  pb.element=el;
  Operators$1.OnAfterRender(function(el$1)
  {
   Global.jQuery(el$1.Dom).progressbar(conf);
  },el);
  return pb;
 };
 Progressbar.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Progressbar);
 ProgressbarConfiguration=JQueryUI.ProgressbarConfiguration=Runtime.Class({},Obj,ProgressbarConfiguration);
 ProgressbarConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Disabled=null;
  this.Value=0;
  this.Max=0;
 },ProgressbarConfiguration);
 Slider=JQueryUI.Slider=Runtime.Class({
  OnChange:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("slidechange",function(x)
    {
     f(x);
    });
   },this);
  },
  get_Value:function()
  {
   return Global.jQuery(this.element.Dom).slider("value");
  }
 },Pagelet$1,Slider);
 Slider.New2=function()
 {
  return Slider.New1(new SliderConfiguration.New());
 };
 Slider.New1=function(conf)
 {
  var s,x;
  function f(el)
  {
   Global.jQuery(el.Dom).slider(conf);
  }
  s=new Slider.New();
  s.element=(x=Tags.Tags().NewTag("div",[]),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x));
  return s;
 };
 Slider.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Slider);
 Element=Client$1.Element=Runtime.Class({
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  },
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  }
 },Pagelet,Element);
 Element.New=function(html,name)
 {
  var el,dom;
  el=new Element.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element);
 TabsConfiguration=JQueryUI.TabsConfiguration=Runtime.Class({},Obj,TabsConfiguration);
 TabsConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Active=0;
  this.Collapsible=null;
  this.Disabled=null;
  this.Event=null;
  this.HeightStyle=null;
  this.Hide=null;
  this.Show=null;
 },TabsConfiguration);
 Sortable=JQueryUI.Sortable=Runtime.Class({},Pagelet$1,Sortable);
 Sortable.New2=function(el)
 {
  return Sortable.New1(el,new SortableConfiguration.New());
 };
 Sortable.New1=function(el,conf)
 {
  var s;
  function f(el$1)
  {
   Global.jQuery(el$1.Dom).sortable(conf);
  }
  s=new Sortable.New();
  s.element=(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(el),el);
  return s;
 };
 Sortable.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Sortable);
 PositionConfiguration=JQueryUI.PositionConfiguration=Runtime.Class({
  set_Of:function(t)
  {
   this.ofTarget=t;
   this.of=t.get_Get();
  }
 },Obj,PositionConfiguration);
 PositionConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.My=null;
  this.At=null;
  this.Collision=null;
  this.By=null;
  this.Bgiframe=null;
 },PositionConfiguration);
 Target=JQueryUI.Target=Runtime.Class({
  get_Get:function()
  {
   return this.$==1?this.$0:this.$==2?"#"+this.$0:this.$0;
  }
 },null,Target);
 Position=JQueryUI.Position=Runtime.Class({},Pagelet$1,Position);
 Position.New1=function(el,conf)
 {
  var a;
  function f(el$1)
  {
   Global.jQuery(el$1.Dom).position(conf);
  }
  a=new Position.New();
  a.element=(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(el),el);
  return a;
 };
 Position.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Position);
 Resizable=JQueryUI.Resizable=Runtime.Class({
  OnStart:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("resizestart",function(x,y)
    {
     (f(x))(y);
    });
   },this);
  },
  OnResize:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("resize",function(x,y)
    {
     (f(x))(y);
    });
   },this);
  },
  OnStop:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("resizestop",function(x,y)
    {
     (f(x))(y);
    });
   },this);
  }
 },Pagelet$1,Resizable);
 Resizable.New2=function(el)
 {
  return Resizable.New1(el,new ResizableConfiguration.New());
 };
 Resizable.New1=function(el,conf)
 {
  var a;
  function f(el$1)
  {
   Global.jQuery(el$1.Dom).resizable(conf);
  }
  a=new Resizable.New();
  a.element=(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(el),el);
  return a;
 };
 Resizable.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Resizable);
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.HtmlProvider=new JQueryHtmlProvider.New();
  SC$1.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$1.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags$1=Implementation.Tags();
  SC$1.Deprecated=Implementation.DeprecatedHtml();
  SC$1.Attr$1=Implementation.Attr();
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 AccordionConfiguration=JQueryUI.AccordionConfiguration=Runtime.Class({},Obj,AccordionConfiguration);
 AccordionConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Active=0;
  this.Animated=null;
  this.Collapsible=null;
  this.Disabled=null;
  this.Event=null;
  this.Header=null;
  this.HeightStyle=null;
  this.Icons=null;
 },AccordionConfiguration);
 EventsPervasives.Events=function()
 {
  SC$2.$cctor();
  return SC$2.Events;
 };
 ButtonConfiguration=JQueryUI.ButtonConfiguration=Runtime.Class({},Obj,ButtonConfiguration);
 ButtonConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Disabled=null;
  this.Icons=null;
  this.Label=null;
  this.Text=null;
 },ButtonConfiguration);
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Autocomplete=JQueryUI.Autocomplete=Runtime.Class({
  OnChange:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("autocompletechange",function(x,y)
    {
     (f(x))(y.item);
    });
   },this);
  },
  OnClose:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("autocompleteclose",function(x)
    {
     f(x);
    });
   },this);
  },
  OnSearch:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("autocompletesearch",function(x)
    {
     f(x);
    });
   },this);
  },
  OnFocus:function(f)
  {
   var $this;
   $this=this;
   Operators$1.OnAfterRender(function()
   {
    Global.jQuery($this.element.Dom).bind("autocompletefocus",function(x,y)
    {
     (f(x))(y.item);
    });
   },this);
  }
 },Pagelet$1,Autocomplete);
 Autocomplete.New1=function(el,conf)
 {
  var a;
  a=new Autocomplete.New();
  Operators$1.OnAfterRender(function(el$1)
  {
   Global.jQuery(el$1.Dom).autocomplete(conf);
  },el);
  a.element=el;
  return a;
 };
 Autocomplete.New=Runtime.Ctor(function()
 {
  Pagelet$1.New.call(this);
 },Autocomplete);
 AttributeBuilder=Client$1.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 SliderConfiguration=JQueryUI.SliderConfiguration=Runtime.Class({},Obj,SliderConfiguration);
 SliderConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.Animate=null;
  this.Disabled=null;
  this.Max=0;
  this.Min=0;
  this.Orientation=null;
  this.Range=null;
  this.Step=0;
  this.Value=0;
  this.Values=null;
 },SliderConfiguration);
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.concat=function(ss)
 {
  return{
   GetEnumerator:function()
   {
    var outerE;
    outerE=Enumerator.Get(ss);
    return new T$1.New(null,null,function(st)
    {
     var m;
     while(true)
      {
       m=st.s;
       if(Unchecked.Equals(m,null))
       {
        if(outerE.MoveNext())
         {
          st.s=Enumerator.Get(outerE.Current());
          st=st;
         }
        else
         {
          outerE.Dispose();
          return false;
         }
       }
       else
        if(m.MoveNext())
         {
          st.c=m.Current();
          return true;
         }
        else
         {
          st.Dispose();
          st.s=null;
          st=st;
         }
      }
    },function(st)
    {
     var x;
     x=st.s;
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
     !Unchecked.Equals(outerE,null)?outerE.Dispose():void 0;
    });
   }
  };
 };
 SortableConfiguration=JQueryUI.SortableConfiguration=Runtime.Class({},Obj,SortableConfiguration);
 SortableConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AppendTo=null;
  this.Axis=null;
  this.Cancel=null;
  this.ConnectWith=null;
  this.Containment=null;
  this.Cursor=null;
  this.CursorAt=null;
  this.Delay=0;
  this.Disabled=null;
  this.Distance=0;
  this.DropOnEmpty=null;
  this.ForceHelperSize=null;
  this.ForcePlaceholderSize=null;
  this.Grid=null;
  this.Handle=null;
  this.Helper=null;
  this.Items=null;
  this.Opacity=0;
  this.Placeholder=null;
  this.Revert=null;
  this.Scroll=null;
  this.ScrollSensitivity=0;
  this.ScrollSpeed=0;
  this.Tolerance=null;
  this.ZIndex=0;
 },SortableConfiguration);
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 ResizableConfiguration=JQueryUI.ResizableConfiguration=Runtime.Class({},Obj,ResizableConfiguration);
 ResizableConfiguration.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.AlsoResize=null;
  this.Animate=null;
  this.AnimateDuration=null;
  this.AnimateEasing=null;
  this.AspectRatio=0;
  this.AutoHide=null;
  this.Cancel=null;
  this.Containment=null;
  this.Delay=0;
  this.Disabled=null;
  this.Distance=0;
  this.Ghost=null;
  this.Grid=null;
  this.Handles=null;
  this.Helper=null;
  this.MaxHeight=0;
  this.MaxWidth=0;
  this.MinHeight=0;
  this.MinWidth=0;
 },ResizableConfiguration);
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=Global.jQuery(node);
   a=Global.jQuery(el);
   _this.append.apply(_this,[a]);
  },
  SetAttribute:function(node,name,value)
  {
   Global.jQuery(node).attr(name,value);
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$1.$cctor();
  return SC$1.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$1.$cctor();
  return SC$1.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr;
 };
 DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Text=Client$1.Text=Runtime.Class({
  get_Body:function()
  {
   return self.document.createTextNode(this.text);
  }
 },Pagelet,Text);
 Text.New=Runtime.Ctor(function(text)
 {
  Pagelet.New.call(this);
  this.text=text;
 },Text);
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.Events=new JQueryEventSupport.New();
 };
 Attribute=Client$1.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 JQueryEventSupport=Events.JQueryEventSupport=Runtime.Class({
  OnMouse:function(name,f,el)
  {
   Global.jQuery(el.get_Body()).on(name,function(ev)
   {
    return f(el,{
     X:ev.pageX,
     Y:ev.pageY,
     Event:ev
    });
   });
  },
  OnClick:function(f,el)
  {
   this.OnMouse("click",function($1,$2)
   {
    return(f($1))($2);
   },el);
  }
 },Obj,JQueryEventSupport);
 JQueryEventSupport.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryEventSupport);
 Runtime.OnLoad(function()
 {
  Client.Tests();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
