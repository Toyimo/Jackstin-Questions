import numpy as np
import sympy as sym
from sympy import sin,cos,pi
I = sym.Matrix([
    [1,0,0],
    [0,1,0],
    [0,0,1]
])

mu,nu = sym.symbols("mu,nu")
s = [-sin(mu),cos(mu),0]
As = sym.Matrix([
    [0,-s[2],s[1]],
    [s[2],0,-s[0]],
    [-s[1],s[0],0]
])
As2 = As*As
print(sym.latex(sym.simplify(As2)))
#利用轴角公式计算旋转矩阵，其中轴为(-sin(mu),cos(mu),0),转角为nu
R = I + sin(nu)*As + (1-cos(nu))*As2
print(sym.latex(sym.simplify(R)))
